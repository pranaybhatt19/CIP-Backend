import { Joi, Segments } from "celebrate";

const experienceFilterSchema = Joi.object({
  type: Joi.string()
    .valid("LESS_THAN", "GREATER_THAN", "EQUALS")
    .required()
    .messages({
      "any.required": "Experience filter type is required",
      "string.base": "Experience filter type must be a string",
      "any.only":
        "Experience filter type must be one of: LESS_THAN, GREATER_THAN, or EQUALS",
    }),
  value: Joi.number().min(0).required().messages({
    "any.required": "Experience filter value is required",
    "number.base": "Experience filter value must be a number",
    "number.min": "Experience filter value must be at least 0",
  }),
});

const totalAttemptsSchema = Joi.object({
  type: Joi.string()
    .valid("LESS_THAN", "GREATER_THAN", "EQUALS")
    .required()
    .messages({
      "any.required": "Attempts filter type is required",
      "string.base": "Attempts filter type must be a string",
      "any.only":
        "Attempts filter type must be one of: LESS_THAN, GREATER_THAN, or EQUALS",
    }),
  value: Joi.number().integer().min(1).required().messages({
    "any.required": "Attempts filter value is required",
    "number.base": "Attempts filter value must be a number",
    "number.min": "Attempts filter value must be at least 1",
    "number.integer": "Attempts filter value must be an integer",
  }),
});

const lastCommunicationDateSchema = Joi.object({
  exactDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "Exact Date must be a valid date",
    "date.format": "Exact Date must be in ISO format (YYYY-MM-DD)",
  }),

  fromDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "From Date must be a valid date",
    "date.format": "From Date must be in ISO format (YYYY-MM-DD)",
  }),

  toDate: Joi.date()
    .iso()
    .allow(null)
    .optional()
    .when("fromDate", {
      is: Joi.date().iso(),
      then: Joi.date().greater(Joi.ref("fromDate")),
      otherwise: Joi.date().allow(null),
    })
    .messages({
      "date.base": "To Date must be a valid date",
      "date.greater": "To Date must be greater than From Date",
      "date.format": "To Date must be in ISO format (YYYY-MM-DD)",
    }),
});

export const searchUsersSchema = {
  [Segments.BODY]: Joi.object({
    full_name: Joi.string().trim().min(2).max(100).optional().messages({
      "string.base": "Full name must be a string",
      "string.min": "Full name must have at least 2 characters",
      "string.max": "Full name cannot exceed 100 characters",
    }),

    designation_ids: Joi.array()
      .items(
        Joi.number().integer().messages({
          "number.base": "Each designation ID must be a number",
          "number.integer": "Designation ID must be an integer",
        })
      )
      .min(1)
      .optional()
      .messages({
        "array.base": "Designations must be an array of IDs",
        "array.min": "Please select at least one designation",
      }),

    tags_filter: Joi.array()
    .items(
      Joi.string().messages({
        "string.base": "Each tag must be a string",
      })
    )
    .optional()
    .messages({
      "array.base": "Tags must be an array of tag",
    }),

    experience: experienceFilterSchema.optional(),
    education_medium: Joi.array()
      .items(
        Joi.string().trim().min(1).messages({
          "string.base": "Each education medium must be a string",
          "string.empty": "Education medium cannot be empty",
        })
      )
      .min(1)
      .optional()
      .messages({
        "array.base": "Education medium must be an array of strings",
        "array.min": "Please select at least one education medium",
      }),
    reporting_persons_ids: Joi.array()
      .items(
        Joi.number().integer().messages({
          "number.base": "Each reporting person ID must be a number",
          "number.integer": "Reporting person ID must be an integer",
        })
      )
      .min(1)
      .optional()
      .messages({
        "array.base": "Reporting persons must be an array of IDs",
        "array.min": "Please select at least one reporting person",
      }),

    attempts: totalAttemptsSchema.optional(),

    last_communication_date: lastCommunicationDateSchema.optional(),

    isTreeView: Joi.boolean().optional().messages({
      "boolean.base": "Tree view flag must be true or false",
    }),

    limit: Joi.number().integer().positive().optional().messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.positive": "Limit must be greater than 0",
    }),

    offset: Joi.number().integer().min(0).optional().messages({
      "number.base": "Offset must be a number",
      "number.integer": "Offset must be an integer",
      "number.min": "Offset must be at least 0",
    }),

    order: Joi.array()
      .items(
        Joi.array()
          .ordered(
            Joi.string().required().messages({
              "string.base": "Order field must be a string",
              "any.required": "Order field is required",
            }),
            Joi.string().valid("ASC", "DESC").required().messages({
              "string.base": "Order type must be a string",
              "any.only": "Order type must be either ASC or DESC",
              "any.required": "Order type is required",
            })
          )
          .length(2)
      )
      .optional()
      .messages({
        "array.base": "Order must be an array of [field, direction]",
      }),
  }),
};
