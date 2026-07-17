import swaggerJSDoc from 'swagger-jsdoc';

const APP_BASE_URL = String(process.env.APP_BASE_URL || 'https://backendutn-tpf.onrender.com').trim();
const APP_BASE_URL_NORMALIZED = APP_BASE_URL.replace(/\/+$/, '');

const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Bookmarks API',
            version: '1.0.0',
            description: 'API para gestion de links y espacios multiusuario.'
        },
        servers: [
            {
                url: APP_BASE_URL_NORMALIZED,
                description: 'Servidor produccion (Render)'
            },
            {
                url: 'http://localhost:5000',
                description: 'Servidor local'
            }
        ],
        tags: [
            { name: 'Links' },
            { name: 'Espacios' },
            { name: 'Usuarios' },
            { name: 'Solicitudes' },
            { name: 'Extras' }
        ],
        components: {
            schemas: {
                LinkPayload: {
                    type: 'object',
                    required: ['idEspacio', 'nombre', 'direccion'],
                    properties: {
                        idEspacio: { type: 'integer', example: 3 },
                        nombre: { type: 'string', example: 'NASA' },
                        comentario: { type: 'string', example: 'Sitio oficial' },
                        direccion: { type: 'string', example: 'https://www.nasa.gov' }
                    }
                },
                CrearUsuarioPayload: {
                    type: 'object',
                    required: ['nombre'],
                    properties: {
                        nombre: { type: 'string', example: 'usuario1' },
                        email: { type: 'string', example: 'usuario1@mail.com' }
                    }
                },
                CrearEspacioPayload: {
                    type: 'object',
                    required: ['denominacion'],
                    properties: {
                        denominacion: { type: 'string', example: 'Astronomia' },
                        idOwner: { type: 'integer', example: 2, nullable: true },
                        tipoEspacio: { type: 'string', example: 'publico', enum: ['publico', 'privado', '0', '1'] }
                    }
                },
                SolicitudPayload: {
                    type: 'object',
                    required: ['idUsuario'],
                    properties: {
                        idUsuario: { type: 'integer', example: 1 }
                    }
                },
                AprobacionPayload: {
                    type: 'object',
                    required: ['aprobadoPor'],
                    properties: {
                        aprobadoPor: { type: 'integer', example: 2 }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Mensaje de error' }
                    }
                }
            }
        },
        paths: {
            '/api/links': {
                get: {
                    tags: ['Links'],
                    summary: 'Listar links o buscar por query (REST)',
                    parameters: [
                        {
                            name: 'idEspacio',
                            in: 'query',
                            required: false,
                            schema: { type: 'integer' },
                            description: 'Filtra por espacio (id numerico).'
                        },
                        {
                            name: 'nombre',
                            in: 'query',
                            required: false,
                            schema: { type: 'string' }
                        },
                        {
                            name: 'comentario',
                            in: 'query',
                            required: false,
                            schema: { type: 'string' }
                        },
                        {
                            name: 'direccion',
                            in: 'query',
                            required: false,
                            schema: { type: 'string' }
                        }
                    ],
                    responses: {
                        200: { description: 'OK' }
                    }
                },
                post: {
                    tags: ['Links'],
                    summary: 'Crear link (REST)',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LinkPayload' }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Creado' },
                        400: { description: 'Payload invalido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/links/{id}': {
                get: {
                    tags: ['Links'],
                    summary: 'Obtener link por ID',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        200: { description: 'OK' },
                        404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                },
                patch: {
                    tags: ['Links'],
                    summary: 'Actualizar link (REST)',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LinkPayload' }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Actualizado' },
                        404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                },
                delete: {
                    tags: ['Links'],
                    summary: 'Eliminar link (REST)',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        200: { description: 'Eliminado' },
                        404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/crear': {
                post: {
                    tags: ['Links'],
                    summary: 'Crear link (legacy, deprecado)',
                    deprecated: true,
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LinkPayload' }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Creado' },
                        400: { description: 'Payload invalido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/actualizar/{id}': {
                put: {
                    tags: ['Links'],
                    summary: 'Actualizar link (legacy, deprecado)',
                    deprecated: true,
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LinkPayload' }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Actualizado' },
                        404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/eliminar/{id}': {
                delete: {
                    tags: ['Links'],
                    summary: 'Eliminar link (legacy, deprecado)',
                    deprecated: true,
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        200: { description: 'Eliminado' },
                        404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/buscar': {
                post: {
                    tags: ['Links'],
                    summary: 'Buscar links por filtros (legacy, deprecado)',
                    deprecated: true,
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        idEspacio: { type: 'integer', example: 3 },
                                        nombre: { type: 'string', example: '' },
                                        comentario: { type: 'string', example: '' },
                                        direccion: { type: 'string', example: '' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'OK' },
                        400: { description: 'Sin filtros', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/usuarios': {
                get: {
                    tags: ['Usuarios'],
                    summary: 'Listar usuarios',
                    responses: {
                        200: { description: 'OK' }
                    }
                },
                post: {
                    tags: ['Usuarios'],
                    summary: 'Crear usuario',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CrearUsuarioPayload' }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Creado' },
                        400: { description: 'Payload invalido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/usuarios/{id}': {
                delete: {
                    tags: ['Usuarios'],
                    summary: 'Eliminar usuario y dependencias (cleanup de pruebas, sin auth)',
                    description: 'Endpoint simplificado para limpieza de datos de demo del TP. No requiere Bearer token.',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        200: { description: 'Usuario y datos asociados eliminados' },
                        404: { description: 'Usuario no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/estados-solicitudes': {
                get: {
                    tags: ['Solicitudes'],
                    summary: 'Listar estados de solicitud',
                    responses: {
                        200: { description: 'OK' }
                    }
                }
            },
            '/api/espacios': {
                get: {
                    tags: ['Espacios'],
                    summary: 'Listar espacios',
                    responses: {
                        200: { description: 'OK' }
                    }
                },
                post: {
                    tags: ['Espacios'],
                    summary: 'Crear espacio',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CrearEspacioPayload' }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Creado' },
                        400: { description: 'Payload invalido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/espacios/{id}': {
                get: {
                    tags: ['Espacios'],
                    summary: 'Obtener espacio por ID',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        200: { description: 'OK' },
                        404: { description: 'No encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/espacios/{id}/generar-html': {
                post: {
                    tags: ['Extras'],
                    summary: 'Generar y descargar HTML del espacio seleccionado',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        200: { description: 'HTML generado' },
                        404: { description: 'Espacio no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/espacios/{id}/miembros': {
                get: {
                    tags: ['Espacios'],
                    summary: 'Listar miembros del espacio',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    responses: {
                        200: { description: 'OK' }
                    }
                }
            },
            '/api/espacios/{id}/solicitudes': {
                post: {
                    tags: ['Solicitudes'],
                    summary: 'Solicitar ingreso a un espacio',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'integer' }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SolicitudPayload' }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Solicitud creada' },
                        404: { description: 'Espacio no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/espacios/{id}/solicitudes/{idUsuario}/aprobar': {
                put: {
                    tags: ['Solicitudes'],
                    summary: 'Aprobar solicitud de ingreso',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                        { name: 'idUsuario', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AprobacionPayload' }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Solicitud aprobada' },
                        404: { description: 'Solicitud no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/espacios/{id}/solicitudes/{idUsuario}/rechazar': {
                put: {
                    tags: ['Solicitudes'],
                    summary: 'Rechazar solicitud de ingreso',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                        { name: 'idUsuario', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AprobacionPayload' }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Solicitud rechazada' },
                        404: { description: 'Solicitud no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/espacios/{id}/usuarios/{idUsuario}/expulsar': {
                put: {
                    tags: ['Solicitudes'],
                    summary: 'Expulsar usuario de un espacio',
                    parameters: [
                        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
                        { name: 'idUsuario', in: 'path', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AprobacionPayload' }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Usuario expulsado' },
                        404: { description: 'Relacion no encontrada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/log-view': {
                get: {
                    tags: ['Extras'],
                    summary: 'Ver log en HTML',
                    responses: {
                        200: { description: 'OK' }
                    }
                }
            },
            '/api/leePdf': {
                post: {
                    tags: ['Extras'],
                    summary: 'Ejecutar lectura de PDF (extra)',
                    responses: {
                        200: { description: 'OK' }
                    }
                }
            },
            '/api/manual-pdf': {
                get: {
                    tags: ['Extras'],
                    summary: 'Visualizar manual PDF',
                    responses: {
                        200: { description: 'OK (application/pdf)' },
                        404: { description: 'Manual no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
                    }
                }
            },
            '/api/leeLog': {
                post: {
                    tags: ['Extras'],
                    summary: 'Ejecutar lectura de log (extra)',
                    responses: {
                        200: { description: 'OK' }
                    }
                }
            }
        }
    },
    apis: []
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
