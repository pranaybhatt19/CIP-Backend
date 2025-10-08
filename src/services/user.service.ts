import { Request, Response } from "express";
import { AppDataSource } from "../database/config/data-source";
import bcrypt from "bcryptjs";
import { Communications, Designation, User } from "../entities";
import { generatePassword, passwordValidation } from "../utils/validators";
import { registeredEmailTemplate, sendEmail } from "../utils/email-manager";
import { AddNewUserDto, AddPracticeDto } from "../dto";
import { ISavePractice } from "../interfaces";
import { AuthRequest } from "../middlewares/auth.middleware";

const userRepository = AppDataSource.getRepository(User);
const designationsRepository = AppDataSource.getRepository(Designation);
const communicationRepository = AppDataSource.getRepository(Communications);

const registerUser = async (req: Request, res: Response): Promise<any> => {
  const {
    firstName,
    middleName,
    lastName,
    email,
    designation,
    experience,
    reportingPerson,
  }: AddNewUserDto = req.body;

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

    const subject = "Communication Improvement Program: Get started with CIP";
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
    const { id, password, status } = req.body;

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
      return res.status(403).json({ message: "Not authorized to see other user's information" });
    }
    
    const queryBuilder = await communicationRepository
      .createQueryBuilder("practice")
      .where("practice.user_id = :userId", { userId: numericId })
      .andWhere("practice.is_deleted = :status", { status: false })
      .orderBy("practice.id", "DESC");

    if (dateExact || dateFrom || dateTo) {
      if (dateFrom && dateTo) {
        const from = parseToDate(dateFrom);
        const to = parseToDate(dateTo);
        if (!from || !to) {
          return res.status(400).json({
            message:
              "Invalid dateFrom/dateTo format. Use YYYY-MM-DD or a valid date.",
          });
        }
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        const next = new Date(to);
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        queryBuilder.andWhere("t.date >= :fromDay AND t.date < :toNextDay", {
          fromDay: start.toISOString(),
          toNextDay: next.toISOString(),
        });
      }
      if (dateExact) {
        const date = parseToDate(dateExact);
        if (!date) {
          return res.status(400).json({
            message:
              "Invalid dateExact format. Use YYYY-MM-DD or a valid date.",
          });
        }
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const next = new Date(start);
        next.setDate(next.getDate() + 1);

        queryBuilder.andWhere("t.date >= :startOfDay AND t.date < :nextDay", {
          startOfDay: start.toISOString(),
          nextDay: next.toISOString(),
        });
      }
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
      }
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

const isAncestorOrSelf = async (targetId: number, requesterId: number): Promise<boolean> => {
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
    const { total_count, experience_years, attempts_count, ...rest } = user;

    userMap[user.user_id] = {
      ...rest,
      experience: user.experience_years,
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
      name: nameFilter,
      designation_ids: rawDesignationIds,
      reporting_persons_ids: rawReportingPersonIds,
      experience,
      attempts,
      last_communication_date,
      limit,
      offset,
      order,
      isTreeView,
    } = req.body;

    const designationIds = rawDesignationIds?.length ? rawDesignationIds : null;
    const reportingPersonIds = rawReportingPersonIds?.length
      ? rawReportingPersonIds
      : null;

    const values = [
      Number(user?.sub),
      nameFilter ?? null,
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
    ];
    const functionName = isTreeView
      ? "get_user_tree_hierarchy"
      : "get_user_hierarchy";
    const sql = `SELECT * FROM cip_schema.${functionName}($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`;

    const rows = await AppDataSource.manager.query(sql, values);
    if (!isTreeView) {
      const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 0) : 0;
      const data = rows.map((r: any) => ({
        user_id: r.user_id,
        name: r.name,
        full_name: r.full_name,
        email: r.email,
        reporting_person: r.reporting_person,
        designation: r.designation,
        experience: r.experience_years,
        attempts: parseInt(r.attempts_count, 0),
        last_communication_date: r.last_communication_date,
      }));
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
    const userId = req.user?.sub;
    const sql = `
      SELECT * FROM cip_schema.get_reporting_persons_hierarchy(
        $1
      )
    `;
    const reportingPersons = await AppDataSource.manager.query(sql, [userId]);
    return res.status(200).json({
      data: reportingPersons,
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

export {
  registerUser,
  searchUsersFilter,
  getReportingPersonsList,
  getDesignationsList,
  addNewPractice,
  updateUserDetails,
  deletePracticeResult,
  getPracticeDetailsByUserId,
};
