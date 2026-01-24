import { z } from 'zod';

/**
 * Schema de validação para IDs de assets (UUIDs)
 */
export const AssetIdSchema = z.string().uuid('ID de asset inválido');

/**
 * Schema de validação para paths de arquivo
 */
export const FilePathSchema = z
  .string()
  .min(1, 'Path não pode estar vazio')
  .refine((path) => !path.includes('..'), 'Path não pode conter ".."')
  .refine((path) => !/[<>:"|?*\x00-\x1f]/.test(path), 'Path contém caracteres inválidos');

/**
 * Schema de validação para atualizações de asset
 */
export const AssetUpdateSchema = z.object({
  rating: z.number().int().min(0).max(5).optional(),
  flagged: z.boolean().optional(),
  rejected: z.boolean().optional(),
  colorLabel: z
    .enum(['red', 'yellow', 'green', 'blue', 'purple', 'none'])
    .or(z.null())
    .optional(),
  tags: z.string().max(5000, 'Tags excedem o limite de 5000 caracteres').optional(),
  notes: z.string().max(10000, 'Notas excedem o limite de 10000 caracteres').optional()
});

/**
 * Schema de validação para filtros de asset
 */
export const AssetFilterSchema = z.object({
  mediaType: z.enum(['video', 'photo']).or(z.null()).optional(),
  rating: z.number().int().min(0).max(5).optional(),
  flagged: z.boolean().optional(),
  rejected: z.boolean().optional(),
  searchQuery: z.string().max(500).optional(),
  volumeUuid: z.string().uuid().optional()
});

/**
 * Schema de validação para UUIDs de volume
 */
export const VolumeUuidSchema = z.string().uuid('UUID de volume inválido');

/**
 * Schema de validação para nomes de volume
 */
export const VolumeLabelSchema = z
  .string()
  .min(1, 'Nome do volume não pode estar vazio')
  .max(255, 'Nome do volume muito longo')
  .refine((label) => !/[<>:"/\\|?*\x00-\x1f]/.test(label), 'Nome contém caracteres inválidos');

/**
 * Schema de validação para exportação (copy/zip)
 */
export const ExportOptionsSchema = z.object({
  assetIds: z.array(AssetIdSchema).min(1, 'Selecione pelo menos um asset'),
  destinationPath: FilePathSchema,
  preserveFolders: z.boolean().optional().default(false),
  format: z.enum(['copy', 'zip']).optional().default('copy')
});

/**
 * Schema de validação para operações de move
 */
export const MoveOptionsSchema = z.object({
  assetIds: z.array(AssetIdSchema).min(1, 'Selecione pelo menos um asset'),
  destinationPath: FilePathSchema,
  preserveFolders: z.boolean().optional().default(false),
  pathPrefix: z.string().optional().default('')
});

/**
 * Helpers para validação
 */
export const ValidationHelpers = {
  /**
   * Valida um asset ID e retorna o resultado
   */
  validateAssetId(id: unknown): { success: true; data: string } | { success: false; error: string } {
    const result = AssetIdSchema.safeParse(id);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.errors[0]?.message || 'ID inválido' };
  },

  /**
   * Valida um array de asset IDs
   */
  validateAssetIds(
    ids: unknown[]
  ): { success: true; data: string[] } | { success: false; error: string } {
    const schema = z.array(AssetIdSchema);
    const result = schema.safeParse(ids);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.errors[0]?.message || 'IDs inválidos' };
  },

  /**
   * Valida um file path
   */
  validatePath(path: unknown): { success: true; data: string } | { success: false; error: string } {
    const result = FilePathSchema.safeParse(path);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.errors[0]?.message || 'Path inválido' };
  },

  /**
   * Valida um update de asset
   */
  validateAssetUpdate(
    update: unknown
  ):
    | { success: true; data: z.infer<typeof AssetUpdateSchema> }
    | { success: false; error: string } {
    const result = AssetUpdateSchema.safeParse(update);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.errors[0]?.message || 'Dados inválidos' };
  },

  /**
   * Extrai mensagem de erro amigável de ZodError
   */
  getErrorMessage(error: z.ZodError): string {
    const firstError = error.errors[0];
    if (!firstError) return 'Dados inválidos';

    const path = firstError.path.join('.');
    return path ? `${path}: ${firstError.message}` : firstError.message;
  }
};
