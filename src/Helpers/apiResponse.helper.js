class ApiResponseHelper {
    success(response, data, message = 'Operacion exitosa', status = 200) {
        return response.status(status).json({
            ok: true,
            status,
            message,
            data
        });
    }

    created(response, data, message = 'Recurso creado con exito') {
        return this.success(response, data, message, 201);
    }
}

const apiResponse = new ApiResponseHelper();

export default apiResponse;