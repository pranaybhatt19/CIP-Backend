import { Joi, Segments } from "celebrate";

const experienceFilterSchema = Joi.object({
  type: Joi.string()
    .valid("LESS_THAN", "GREATER_THAN", "EQUALS")
    .required()
    .messages({
      "any.required": "Score filter type is required",
      "string.base": "Score filter type must be a string",
      "any.only":
        "Score filter type must be one of: LESS_THAN, GREATER_THAN, EQUALS",
    }),
  value: Joi.number().min(0).required().messages({
    "any.required": "Score filter value is required",
    "number.base": "Score filter value must be a number",
    "number.min": "Score filter value must be at least 0",
  }),
});
const totalAttemptsSchema = Joi.object({
  type: Joi.string().valid("LESS_THAN", "GREATER_THAN", "EQUALS").required(),
  value: Joi.number().integer().min(1).required().messages({
    "any.required": "total attempts filter value is required",
    "number.base": "total attempts filter value must be a number",
    "number.min": "total attempts filter value must be at least 0",
  }),
});

const lastCommunicationDateSchema = Joi.object({
  exactDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": `"exactDate" must be a valid date`,
    "date.format": `"exactDate" must be in ISO format`,
  }),

  fromDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": `"fromDate" must be a valid date`,
    "date.format": `"fromDate" must be in ISO format`,
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
      "date.base": `"toDate" must be a valid date`,
      "date.greater": `"toDate" must be greater than "fromDate"`,
      "date.format": `"toDate" must be in ISO format`,
    }),
});

export const searchUsersSchema = {
  [Segments.BODY]: Joi.object({
    full_name: Joi.string().trim().min(2).max(100).optional(),

    designation_ids: Joi.array()
      .items(Joi.number().integer())
      .min(1)
      .optional(),

    experience: experienceFilterSchema.optional(),

    reporting_persons_ids: Joi.array()
      .items(Joi.number().integer())
      .min(1)
      .optional(),

    attempts: totalAttemptsSchema.optional(),

    last_communication_date: lastCommunicationDateSchema,

    isTreeView: Joi.boolean().optional().messages({
      "boolean.base": "isTreeView must be a boolean value (true or false)",
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
        "array.base": "Order must be an array of [field, order_type]",
      }),
  }),
};
