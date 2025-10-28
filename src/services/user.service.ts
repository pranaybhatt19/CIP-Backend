import { Request, Response } from "express";
import { AppDataSource } from "../database/config/data-source";
import bcrypt from "bcryptjs";
import { Communications, Designation, Tags, User } from "../entities";
import { generatePassword, passwordValidation } from "../utils/validators";
import { registeredEmailTemplate, sendEmail } from "../utils/email-manager";
import { AddNewUserDto, AddPracticeDto } from "../dto";
import { ISavedResponse, ISavePractice } from "../interfaces";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Brackets } from "typeorm";

const userRepository = AppDataSource.getRepository(User);
const designationsRepository = AppDataSource.getRepository(Designation);
const communicationRepository = AppDataSource.getRepository(Communications);
const tagsRepository = AppDataSource.getRepository(Tags);

const registerUser = async (req: Request, res: Response): Promise<any> => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    designation,
    experience,
    reportingPerson,
  } = req.body;

  try {
    const existingUser: User | null = await userRepository.findOne({
      where: [{ email }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }

    if (!designation)
      return res.status(400).json({ message: "Designation must be provided" });
    if (!reportingPerson)
      return res
        .status(400)
        .json({ message: "Reporting Person must be provided" });

    const usersDesignation: any = await designationsRepository
      .createQueryBuilder("d")
      .where("d.id = :dId", { dId: designation })
      .getOne();

    const usersReportingPerson: any = await userRepository
      .createQueryBuilder("urp")
      .where("urp.id = :urpId", { urpId: reportingPerson })
      .getOne();

    const password = generatePassword();
    const hashedPassword: string = await bcrypt.hash(password, 10);
    const fullName: string = `${firstName} ${middleName} ${lastName}`;

    const newUser: User = userRepository.create({
      full_name: fullName,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      email: email,
      password: hashedPassword,
      experience: experience,
      designation: usersDesignation as Designation,
      reporting_person: usersReportingPerson as User,
      is_active: true,
    });

    const newUserPayload: User = await userRepository.save(newUser);

    const subject = "Communication Improvement Portal: Get started with CIP";
    const htmlTemplate = registeredEmailTemplate(
      `${firstName} ${lastName}`,
      newUserPayload.email,
      password
    );

    const emailResponse = await sendEmail(newUser.email, subject, htmlTemplate);
    if (!emailResponse.status) {
      return res.status(401).json({ message: emailResponse.message });
    }

    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateUserDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, password, educationLanguage, status } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Either id or email must be provided" });
    }

    let user: User | null = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (status !== undefined) {
      user.is_active = status;
    }

    if (password) {
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          message: "New password must be different from the old password",
        });
      }
      if (!passwordValidation(password)) {
        return res.status(400).json({
          message:
            "Password does not meet complexity requirements, Please create a strong password",
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    if (educationLanguage) {
      const lowerStringFormate = educationLanguage.toLowerCase().trim();
      user.medium_of_education = lowerStringFormate;
    }

    user.updated_at = new Date();
    const savedUser = await userRepository.save(user);

    return res
      .status(200)
      .json({ message: "User updated successfully", payload: savedUser });
  } catch (err: any) {
    console.error("Error updating user:", err);
    const message = err.message || "Error updating user";
    return res.status(500).json({ message: message });
  }
};

const addNewPractice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, date, link, feedback }: AddPracticeDto = req.body;

    if (!id) {
      return res.status(400).json({ message: "user-id is required" });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    if (!link) {
      return res.status(400).json({ message: "link is required" });
    }

    const user: User | null = await userRepository.findOne({ where: { id } });
    if (!user) {
      return res.status(404).json({
        message: "User not found, Please try again",
      });
    }

    const communicationPracticeDetails: ISavePractice = {
      user: user,
      date: date,
      link: link,
      feedback: feedback ? feedback : null,
    };

    const newPractice: Communications = await communicationRepository.create(
      communicationPracticeDetails
    );
    const savePractice: Communications = await communicationRepository.save(
      newPractice
    );

    return res.status(201).json({
      message: "Communication practice details added successfully",
      payload: savePractice,
    });
  } catch (err: any) {
    console.error("Error adding communication practice details:", err);
    const message =
      err.message || "Error adding communication practice details";
    return res.status(500).json({ message: message });
  }
};

const getPracticeDetailsByUserId = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { id, offset, limit, dateExact, dateFrom, dateTo, order } = req.body;

    const numericId = Number(id);

    if (!id || isNaN(numericId)) {
      return res.status(400).json({
        message: "Invalid practice id",
      });
    }

    const user: User | null = await userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.reporting_person", "reportingPerson")
      .where("user.id = :id", { id: numericId })
      .getOne();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allowed = await isAncestorOrSelf(user.id, Number(req.user?.sub));
    if (!allowed) {
      return res
        .status(403)
        .json({ message: "Not authorized to see other user's information" });
    }

    const queryBuilder = await communicationRepository
      .createQueryBuilder("practice")
      .where("practice.user_id = :userId", { userId: numericId })
      .andWhere("practice.is_deleted = :status", { status: false });

    if (dateExact || dateFrom || dateTo) {
      const startOfDay = (d: Date) => {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x;
      };
      const nextDay = (d: Date) => {
        const x = new Date(d);
        x.setDate(x.getDate() + 1);
        x.setHours(0, 0, 0, 0);
        return x;
      };

      // Grouped OR condition to handle edge cases: (exact-day) OR (from..to both) OR (from-only) OR (to-only)
      queryBuilder.andWhere(
        new Brackets((qb) => {
          let anyConditionAdded = false;

          if (dateExact) {
            const dt = parseToDate(dateExact);
            if (!dt) {
              return res.status(400).json({
                message:
                  "Invalid dateExact format. Use YYYY-MM-DD or a valid date.",
              });
            }
            const exactStart = startOfDay(new Date(dt));
            const exactEnd = nextDay(exactStart);
            qb.where(
              "practice.date >= :exactStart AND practice.date < :exactEnd",
              { exactStart, exactEnd }
            );
            anyConditionAdded = true;
          }

          if (dateFrom && dateTo) {
            const from = parseToDate(dateFrom);
            const to = parseToDate(dateTo);
            if (!from || !to) {
              return res.status(400).json({
                message:
                  "Invalid dateFrom/dateTo format. Use YYYY-MM-DD or a valid date.",
              });
            }
            const fromStart = startOfDay(new Date(from));
            const toExclusive = nextDay(new Date(to));
            if (!anyConditionAdded) {
              qb.where(
                "practice.date >= :fromStart AND practice.date < :toExclusive",
                { fromStart, toExclusive }
              );
              anyConditionAdded = true;
            } else {
              qb.orWhere(
                "practice.date >= :fromStart AND practice.date < :toExclusive",
                { fromStart, toExclusive }
              );
            }
          } else {
            if (dateFrom) {
              const from = parseToDate(dateFrom);
              if (!from)
                return res
                  .status(400)
                  .json({ message: "Invalid dateFrom format." });
              const fromStart = startOfDay(new Date(from));
              if (!anyConditionAdded) {
                qb.where("practice.date >= :fromStart", { fromStart });
                anyConditionAdded = true;
              } else {
                qb.orWhere("practice.date >= :fromStart", { fromStart });
              }
            }

            if (dateTo) {
              const to = parseToDate(dateTo);
              if (!to)
                return res
                  .status(400)
                  .json({ message: "Invalid dateTo format." });
              const toExclusive = nextDay(new Date(to));
              if (!anyConditionAdded) {
                qb.where("practice.date < :toExclusive", { toExclusive });
                anyConditionAdded = true;
              } else {
                qb.orWhere("practice.date < :toExclusive", { toExclusive });
              }
            }
          }
        })
      );
    }

    if (order && order.length > 0) {
      const validColumns = ["date"];

      const [column, order_by] = order[0];

      if (validColumns.includes(column)) {
        let orderColumn;

        orderColumn = `practice.${column}`;

        queryBuilder.orderBy(
          orderColumn,
          order_by.toUpperCase() as "ASC" | "DESC",
          "NULLS LAST"
        );
      } else {
        queryBuilder.orderBy("practice.date", "DESC");
      }
    } else {
      queryBuilder.orderBy("practice.date", "DESC");
    }

    if (limit) queryBuilder.take(limit);
    if (offset) queryBuilder.skip(offset);

    queryBuilder.distinct(true);
    const [practices, total] = await queryBuilder.getManyAndCount();

    const userPractices = {
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
      },
      practices: practices,
      total: total,
    };

    return res.status(200).json({
      message: "Users communication practices fetched successfully",
      payload: userPractices,
    });
  } catch (err: any) {
    console.error("Error fetching user communication practice detail:", err);
    const message =
      err.message ||
      "Error fetching user communication practice detail, Internal server error";
    return res.status(500).json({ message: message });
  }
};

const isAncestorOrSelf = async (
  targetId: number,
  requesterId: number
): Promise<boolean> => {
  if (!targetId || !requesterId) return false;

  const rows: any[] = await AppDataSource.query(
    `
    WITH RECURSIVE ancestors AS (
      SELECT id, reporting_person_id, ARRAY[id] AS path
      FROM cip_schema.users
      WHERE id = $1

      UNION ALL

      SELECT u.id, u.reporting_person_id, a.path || u.id
      FROM cip_schema.users u
      JOIN ancestors a ON u.id = a.reporting_person_id
      WHERE NOT u.id = ANY(a.path)
    )
    SELECT 1 AS ok
    FROM ancestors
    WHERE id = $2
    LIMIT 1;
    `,
    [targetId, requesterId]
  );

  return rows.length > 0;
};

const deletePracticeResult = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Communication-Practice Id is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User Id is required" });
    }

    const user: User | null = await userRepository.findOne({
      where: { id: +userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const communicationResult: Communications | null =
      await communicationRepository.findOne({
        where: { id: +id },
      });
    if (!communicationResult) {
      return res.status(404).json({
        message:
          "Communication-Practice associated with this id not found, Please try again",
      });
    }

    await communicationRepository.update(id, { is_deleted: true });
    return res
      .status(200)
      .json({ message: "Practice record deleted successfully" });
  } catch (err: any) {
    const message =
      err.message || "Error adding communication practice details";
    return res.status(500).json({ message: message });
  }
};

const parseToDate = (val?: string | number) => {
  if (!val) return null;
  const date = new Date(String(val));
  if (isNaN(date.getTime())) return null;
  return date;
};

const buildUserHierarchy = (users: User[], currentUserId: number) => {
  const userMap: Record<number, any> = {};
  const roots: any[] = [];

  users.forEach((user: any) => {
    const {
      total_count,
      experience_years,
      attempts_count,
      medium_of_education,
      ...rest
    } = user;

    userMap[user.user_id] = {
      ...rest,
      education_medium: user.medium_of_education,
      experience: Number(user.experience_years).toFixed(2),
      attempts: parseInt(user.attempts_count, 0),
      childrens: [],
    };
  });
  users.forEach((user: any) => {
    if (user.reporting_person?.id) {
      const parent = userMap[user.reporting_person.id];
      if (parent) {
        parent.childrens.push(userMap[user.user_id]);
      }
    } else {
      roots.push(userMap[user.user_id]);
    }
  });
  if (userMap[currentUserId]) {
    return userMap[currentUserId];
  } else {
    const directReports = users
      .filter((user: any) => user.reporting_person?.id === currentUserId)
      .map((user: any) => userMap[user.user_id]);

    return directReports.length > 0 ? directReports : [];
  }
};

const searchUsersFilter = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;

    const {
      full_name: nameFilter,
      education_medium,
      tags_filter,
      designation_ids: rawDesignationIds,
      reporting_persons_ids: rawReportingPersonIds,
      experience,
      attempts,
      last_communication_date,
      limit,
      offset,
      order,
      isTreeView,
      active_status,
    } = req.body;

    const designationIds = rawDesignationIds?.length ? rawDesignationIds : null;
    const reportingPersonIds = rawReportingPersonIds?.length
      ? rawReportingPersonIds
      : null;

    const values = [
      Number(user?.sub),
      nameFilter ?? null,
      education_medium,
      designationIds,
      reportingPersonIds,
      experience?.type ?? null,
      experience?.value ?? null,
      attempts?.type ?? null,
      attempts?.value ?? null,
      last_communication_date?.exactDate ?? null,
      last_communication_date?.fromDate ?? null,
      last_communication_date?.toDate ?? null,
      limit ?? null,
      offset ?? 0,
      order?.[0]?.[0] ?? "full_name",
      order?.[0]?.[1] ?? "ASC",
      tags_filter,
      active_status,
    ];
    const functionName = isTreeView
      ? "get_user_tree_hierarchy"
      : "get_user_hierarchy";
    const sql = `SELECT * FROM cip_schema.${functionName}($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`;

    const rows = await AppDataSource.manager.query(sql, values);
    if (!isTreeView) {
      const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 0) : 0;
      const data = rows.map(
        ({
          experience_years,
          medium_of_education,
          attempts_count,
          ...rest
        }: any) => ({
          ...rest,
          experience: Number(experience_years).toFixed(2),
          education_medium: medium_of_education,
          attempts: parseInt(attempts_count, 0),
        })
      );
      return res.status(200).json({
        data: { totalCount, data },
        message: "Users fetched successfully",
      });
    } else {
      const hierarchy = buildUserHierarchy(rows, Number(user?.sub));

      return res.status(200).json({
        data: { data: hierarchy },
        message: "Users fetched successfully",
      });
    }
  } catch (error) {
    console.error("Error while user list fetching:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getReportingPersonsList = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const users = await userRepository
      .createQueryBuilder("user")
      .select(["user.id AS id", "user.full_name AS name"])
      .getRawMany();
    return res.status(200).json({
      data: users,
      message: "Reporting Persons list fetched successfully",
    });
  } catch (e: any) {
    console.error("Error while reporting persons fetching:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getDesignationsList = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const designations = await designationsRepository.find({
      select: ["id", "name"],
    });
    return res.status(200).json({
      data: designations,
      message: "Designation list fetched successfully",
    });
  } catch (e: any) {
    console.error("Error while designations fetching:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserCompleteDetails = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const rawData = await userRepository
      .createQueryBuilder("u")
      .leftJoin("u.designation", "userDesignation")
      .leftJoin("u.reporting_person", "reportingPerson")
      .leftJoin("reportingPerson.designation", "roDesignation")
      .select([
        "u.id AS user_id",
        "u.full_name AS user_full_name",
        "u.first_name AS user_first_name",
        "u.middle_name AS user_middle_name",
        "u.last_name AS user_last_name",
        "u.email AS user_email",
        "u.experience AS user_experience",
        "u.is_active AS user_is_active",
        "u.medium_of_education AS user_medium_of_education",
        "userDesignation.name AS user_designation_name",
        "reportingPerson.id AS reporting_person_id",
        "reportingPerson.full_name AS reporting_person_full_name",
        "roDesignation.name AS reporting_person_designation_name",
        `(DATE_PART('year', AGE(NOW(), u.experience)) 
          + DATE_PART('month', AGE(NOW(), u.experience)) / 100)::numeric AS experience_years`,
      ])
      .where("u.id = :userId", { userId: id })
      .getRawOne();

    if (!rawData) {
      return res.status(404).json({
        message: "User details not found for this user ID. Please try again.",
        payload: null,
      });
    }

    const formattedData = {
      id: rawData.user_id,
      full_name: rawData.user_full_name,
      first_name: rawData.user_first_name,
      middle_name: rawData.user_middle_name,
      last_name: rawData.user_last_name,
      email: rawData.user_email,
      experience_start_date: rawData.user_experience,
      experience_years: Number(rawData.experience_years),
      is_active: rawData.user_is_active,
      medium_of_education:
        String(rawData.user_medium_of_education).charAt(0).toUpperCase() +
        String(rawData.user_medium_of_education).slice(1).toLowerCase(),
      designation: {
        name: rawData.user_designation_name,
      },
      reporting_person: rawData.reporting_person_id
        ? {
            id: rawData.reporting_person_id,
            full_name: rawData.reporting_person_full_name,
            designation: {
              name: rawData.reporting_person_designation_name,
            },
          }
        : null,
    };

    return res.status(200).json({
      message: "User details fetched successfully",
      payload: formattedData,
    });
  } catch (err: any) {
    console.error("Error in getUserCompleteDetails:", err);
    return res.status(500).json({
      message: err.message || "Something went wrong while fetching user data",
    });
  }
};

const getMediumDetails = async (req: Request, res: Response): Promise<any> => {
  try {
    const mediumList = await userRepository
      .createQueryBuilder("u")
      .select("u.medium_of_education", "medium_of_education")
      .distinct(true)
      .where("u.medium_of_education IS NOT NULL")
      .getRawMany();

    if (!mediumList || mediumList.length == 0) {
      return res.status(200).json({
        data: [],
        message:
          "Education medium list fetched successfully, No Data is found associated to medium",
      });
    }

    const educationMediumList: string[] = mediumList.map((u) => {
      const refinedMedium = String(u.medium_of_education).trim();
      return (
        refinedMedium.charAt(0).toUpperCase() + refinedMedium.slice(1).trim()
      );
    });

    return res.status(200).json({
      data: educationMediumList,
      message: "Education medium list fetched successfully",
    });
  } catch (err: any) {
    console.error("Error while fetching medium:", err.message);
    return res
      .status(500)
      .json({ message: err.message || "Error while fetching medium" });
  }
};

const addTags = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id, tags } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User-Id must be provided" });
    }

    if (Array.isArray(tags) && tags.length == 0) {
      return res
        .status(400)
        .json({ message: "Tag associated with user must be provided" });
    }

    const user: User | null = await userRepository.findOne({
      where: { id: +id },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const savedStatus: ISavedResponse | undefined = await saveUserTags(
      user,
      tags
    );
    if (!savedStatus || !savedStatus.status) {
      return res.status(500).json({
        message: savedStatus?.message || "Error saving tags",
      });
    }

    return res.status(200).json({
      message: "Tags associated with this user is added successfully",
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message || "Error while adding tag to user" });
  }
};

const saveUserTags = async (user: User, tags: []): Promise<ISavedResponse> => {
  const response: ISavedResponse = {
    message: "",
    status: false,
  };
  try {
    const normalizedSet = new Set(
      tags
        .map((t) =>
          String(t || "")
            .trim()
            .toLowerCase()
        )
        .filter((t) => t.length > 0)
    );

    const normalizedTags = Array.from(normalizedSet);

    if (normalizedTags.length === 0) {
      response.message = "No valid tags to save after normalization";
      return response;
    }

    await tagsRepository.delete({
      user: { id: user.id },
    });

    const toSave = normalizedTags.map((tag: string) =>
      tagsRepository.create({
        user: user,
        tag: tag,
      })
    );

    await tagsRepository.save(toSave);

    response.status = true;
    response.message = "Tags assigned to user successfully";
    return response;
  } catch (err: any) {
    response.message =
      err.message || "Failed to assign tags to user, Please try again";
    return response;
  }
};

const getExistingTags = async (req: Request, res: Response): Promise<any> => {
  try {
    const tags: Tags[] = await tagsRepository
      .createQueryBuilder("t")
      .select("DISTINCT t.tag", "tag")
      .getRawMany();

    if (!tags || tags.length == 0) {
      return res.status(200).json({ message: "No tags found" });
    }

    const tagsPayload = tags.map((tagRecord: any) => tagRecord.tag);

    return res
      .status(200)
      .json({ message: "Tags fetched successfully", data: tagsPayload });
  } catch (err: any) {
    console.error("Error fetching Tags:", err);
    return res
      .status(500)
      .json({ message: err.message || "Error fetching Tags" });
  }
};

export {
  registerUser,
  searchUsersFilter,
  getReportingPersonsList,
  getDesignationsList,
  addNewPractice,
  updateUserDetails,
  deletePracticeResult,
  getPracticeDetailsByUserId,
  getUserCompleteDetails,
  getMediumDetails,
  addTags,
  getExistingTags,
};
