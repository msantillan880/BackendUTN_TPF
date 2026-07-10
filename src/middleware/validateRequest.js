import ServerError from '../Helpers/serverError.helper.js';

export function validateRequest(schema) {
    return (request, _response, next) => {
        const parsed = schema.safeParse(request.body);

        if (!parsed.success) {
            const errors = parsed.error.issues.map((issue) => issue.message).join(' | ');
            return next(new ServerError(`Validacion fallida: ${errors}`, 400));
        }

        request.body = parsed.data;
        return next();
    };
}
