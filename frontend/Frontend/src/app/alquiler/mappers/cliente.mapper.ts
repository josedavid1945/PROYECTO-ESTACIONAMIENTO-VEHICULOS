import { Cliente } from "../interfaces/cliente.interface";

export class ClienteMapper {
    static toClienteDTO(data: any): Cliente {
        return {
            id: data.id,
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono
        };
    }   
    static mapClienteDtoArrayToClienteArray(items:Cliente[]):Cliente[]{
        return items.map(ClienteMapper.toClienteDTO)
    }
}