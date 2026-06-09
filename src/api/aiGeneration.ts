import request from '../utils/request';

export const getAiGenerationTasks = (params: any) => {
    return request({
        url: '/ai-generation/tasks',
        method: 'get',
        params
    });
};

export const getAiGenerationStats = () => {
    return request({
        url: '/ai-generation/stats',
        method: 'get'
    });
};

export const createAiGenerationTask = (body: FormData) => {
    return request({
        url: '/ai-generation/tasks',
        method: 'post',
        data: body,
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
    });
};

export const getAiGenerationTask = (id: number) => {
    return request({
        url: '/ai-generation/tasks/' + id,
        method: 'get'
    });
};

export const getAiGenerationLog = (id: number) => {
    return request({
        url: '/ai-generation/tasks/' + id + '/log',
        method: 'get'
    });
};

export const getAiGenerationArtifacts = (id: number) => {
    return request({
        url: '/ai-generation/tasks/' + id + '/artifacts',
        method: 'get'
    });
};

export const downloadAiGenerationArtifact = async (id: number, filename: string) => {
    try {
        const res = await request({
            url: '/ai-generation/artifacts/' + id + '/download',
            method: 'get',
            responseType: 'blob'
        });
        const blob = new Blob([res.data], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        return { success: true };
    } catch {
        return { success: false };
    }
};

export const downloadAiGenerationArtifactsZip = async (taskId: number, artifactIds: number[], filename: string) => {
    try {
        const res = await request({
            url: '/ai-generation/tasks/' + taskId + '/artifacts/download',
            method: 'post',
            data: { artifactIds },
            responseType: 'blob'
        });
        const blob = new Blob([res.data], { type: 'application/zip' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        return { success: true };
    } catch {
        return { success: false };
    }
};

export const deleteAiGenerationTask = (id: number) => {
    return request({
        url: '/ai-generation/tasks/' + id,
        method: 'delete'
    });
};
