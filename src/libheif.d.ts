export default function init(): Promise<libheif>;

export enum heif_error_code {
  heif_error_Ok = 0,
  heif_error_Input_does_not_exist = 1,
  heif_error_Invalid_input = 2,
  heif_error_Unsupported_filetype = 3,
  heif_error_Unsupported_feature = 4,
  heif_error_Usage_error = 5,
  heif_error_Memory_allocation_error = 6,
  heif_error_Decoder_plugin_error = 7,
  heif_error_Encoder_plugin_error = 8,
  heif_error_Encoding_error = 9,
  heif_error_Color_profile_does_not_exist = 10,
  heif_error_Plugin_loading_error = 11,
}

export enum heif_suberror_code {
  heif_suberror_Unspecified = 0,
  heif_suberror_End_of_data = 100,
  heif_suberror_Invalid_box_size = 101,
  heif_suberror_No_ftyp_box = 102,
  heif_suberror_No_idat_box = 103,
  heif_suberror_No_meta_box = 104,
  heif_suberror_No_hdlr_box = 105,
  heif_suberror_No_hvcC_box = 106,
  heif_suberror_No_pitm_box = 107,
  heif_suberror_No_ipco_box = 108,
  heif_suberror_No_ipma_box = 109,
  heif_suberror_No_iloc_box = 110,
  heif_suberror_No_iinf_box = 111,
  heif_suberror_No_iprp_box = 112,
  heif_suberror_No_iref_box = 113,
  heif_suberror_No_pict_handler = 114,
  heif_suberror_Ipma_box_references_nonexisting_property = 115,
  heif_suberror_No_properties_assigned_to_item = 116,
  heif_suberror_No_item_data = 117,
  heif_suberror_Invalid_grid_data = 118,
  heif_suberror_Missing_grid_images = 119,
  heif_suberror_Invalid_clean_aperture = 120,
  heif_suberror_Invalid_overlay_data = 121,
  heif_suberror_Overlay_image_outside_of_canvas = 122,
  heif_suberror_Auxiliary_image_type_unspecified = 123,
  heif_suberror_No_or_invalid_primary_item = 124,
  heif_suberror_No_infe_box = 125,
  heif_suberror_Unknown_color_profile_type = 126,
  heif_suberror_Wrong_tile_image_chroma_format = 127,
  heif_suberror_Invalid_fractional_number = 128,
  heif_suberror_Invalid_image_size = 129,
  heif_suberror_Invalid_pixi_box = 130,
  heif_suberror_No_av1C_box = 131,
  heif_suberror_Wrong_tile_image_pixel_depth = 132,
  heif_suberror_Unknown_NCLX_color_primaries = 133,
  heif_suberror_Unknown_NCLX_transfer_characteristics = 134,
  heif_suberror_Unknown_NCLX_matrix_coefficients = 135,
  heif_suberror_Invalid_region_data = 136,
  heif_suberror_Security_limit_exceeded = 1000,
  heif_suberror_Nonexisting_item_referenced = 2000,
  heif_suberror_Null_pointer_argument = 2001,
  heif_suberror_Nonexisting_image_channel_referenced = 2002,
  heif_suberror_Unsupported_plugin_version = 2003,
  heif_suberror_Unsupported_writer_version = 2004,
  heif_suberror_Unsupported_parameter = 2005,
  heif_suberror_Invalid_parameter_value = 2006,
  heif_suberror_Invalid_property = 2007,
  heif_suberror_Item_reference_cycle = 2008,
  heif_suberror_Unsupported_codec = 3000,
  heif_suberror_Unsupported_image_type = 3001,
  heif_suberror_Unsupported_data_version = 3002,
  heif_suberror_Unsupported_color_conversion = 3003,
  heif_suberror_Unsupported_item_construction_method = 3004,
  heif_suberror_Unsupported_header_compression_method = 3005,
  heif_suberror_Unsupported_bit_depth = 4000,
  heif_suberror_Cannot_write_output_data = 5000,
  heif_suberror_Encoder_initialization = 5001,
  heif_suberror_Encoder_encoding = 5002,
  heif_suberror_Encoder_cleanup = 5003,
  heif_suberror_Too_many_regions = 5004,
  heif_suberror_Plugin_loading_error = 6000,
  heif_suberror_Plugin_is_not_loaded = 6001,
  heif_suberror_Cannot_read_plugin_directory = 6002,
}

export class heif_context {
  private constructor();
}

export interface heif_error {
  code: heif_error_code;
  subcode: heif_suberror_code;
}

export type heif_item_id = number;

export class heif_image_handle {
  private constructor();
}

export class heif_image_ptr {
  private constructor();
}

export interface heif_image {
  is_primary: number;
  thumbnails: number;
  width: number;
  height: number;
  stride: number;
  plane: Uint8Array;
  ptr: heif_image_ptr;
}

export declare interface libheif {
  heif_error_code: typeof heif_error_code;
  heif_suberror_code: typeof heif_suberror_code;

  heif_get_version(): string;
  heif_get_version_number(): number;
  heif_context_alloc(): heif_context;
  heif_context_free(ctx: heif_context): void;
  heif_context_read_from_memory(
    ctx: heif_context,
    data: ArrayBuffer | Uint8Array | Uint8ClampedArray | Int8Array | String
  ): heif_error;
  heif_context_get_number_of_top_level_images(ctx: heif_context): number;
  heif_js_context_get_list_of_top_level_image_IDs(
    ctx: heif_context
  ): heif_item_id[] | heif_error;
  heif_js_context_get_image_handle(
    ctx: heif_context,
    id: heif_item_id
  ): heif_image_handle | heif_error;
  heif_js_decode_image_rgba(handle: heif_image_handle): heif_image | heif_error;
  heif_image_release(ptr: heif_image_ptr): void;
  heif_image_handle_release(handle: heif_image_handle): void;
}
