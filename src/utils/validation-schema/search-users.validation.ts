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

export const searchUsersSchema = {
  [Segments.BODY]: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),

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
