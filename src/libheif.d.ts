export default function init(): Promise<libheif>

export interface libheif {
    heif_get_version(): string
    heif_get_version_number(): number
    heif_context_alloc(): number
    heif_context_free(ctx: number): void
}
