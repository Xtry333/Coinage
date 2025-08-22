export interface ContainerDTO {
    id: number;
    name: string | null;
    weight: number | null;
    weightUnit: string | null;
    volume: number | null;
    volumeUnit: string | null;
    itemCount: number | null;
}

export interface CreateEditContainerDTO {
    id?: number;
    name?: string | null;
    weight?: number | null;
    weightUnit?: string | null;
    volume?: number | null;
    volumeUnit?: string | null;
    itemCount?: number | null;
}
