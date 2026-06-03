export interface JmxItem {
    id: number;
    srcName: string;
    dstName: string;
    description: string;
    jmxDir: string;
    testCaseId: number;
    jmeterScriptType: number;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface JarItem {
    id: number;
    srcName: string;
    dstName: string;
    description: string;
    jarDir: string;
    testCaseId: number;
    jmeterScriptType: number;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface CsvItem {
    id: number;
    srcName: string;
    dstName: string;
    description: string;
    csvDir: string;
    distributionStrategy: string;
    testCaseId: number;
    jmeterScriptType: number;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}

export interface UploadFileItem {
    id: number;
    srcName: string;
    dstName: string;
    description: string;
    fileDir: string;
    testCaseId: number;
    creator: string;
    modifier: string;
    createTime: string;
    modifyTime: string;
}
