export type ImmichUser = {
  id: string;
  email: string;
  name: string;
};

export type AlbumShareRole = "editor" | "viewer";

export type ImmichAlbumUser = {
  user: ImmichUser;
  role: AlbumShareRole | "owner";
};

export type ImmichTag = {
  id: string;
  name: string;
  /** Full path. Leaf `name` is the last segment. */
  value?: string;
  parentId?: string;
  color?: string;
};

export type ImmichExif = {
  imageWidth?: number;
  imageHeight?: number;
  exifImageWidth?: number;
  exifImageHeight?: number;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  make?: string | null;
  model?: string | null;
  lensModel?: string | null;
  dateTimeOriginal?: string | null;
  modifyDate?: string | null;
  iso?: number | null;
  fNumber?: number | null;
  focalLength?: number | null;
  exposureTime?: string | null;
  orientation?: string | null;
};

export type CuratorAssetEnrichment = {
  resolution?: {
    dpiX: number;
    dpiY: number;
    source: "exif" | "default";
  };
};

export type ImmichPersonSummary = {
  id: string;
  name: string;
  birthDate: string | null;
  thumbnailPath: string;
  isHidden: boolean;
  isFavorite?: boolean;
  updatedAt?: string;
};

/** Person record (same fields as Immich person API). */
export type ImmichPerson = ImmichPersonSummary;

export type ImmichAssetFace = {
  id: string;
  boundingBoxX1: number;
  boundingBoxY1: number;
  boundingBoxX2: number;
  boundingBoxY2: number;
  imageWidth: number;
  imageHeight: number;
  sourceType?: string;
  person: ImmichPerson | null;
};

export type ImmichAsset = {
  id: string;
  originalFileName: string;
  /** Present on Immich responses; used for editability hints. */
  originalMimeType?: string;
  fileCreatedAt: string;
  localDateTime: string;
  updatedAt: string;
  description?: string;
  tags?: ImmichTag[];
  exifInfo?: ImmichExif | null;
  isArchived?: boolean;
  isFavorite?: boolean;
  type?: string;
  people?: ImmichPersonSummary[];
};

export type ImmichAssetWithEnrichment = ImmichAsset & {
  curatorEnrichment?: CuratorAssetEnrichment;
  originalPath?: string;
  width?: number;
  height?: number;
};

export type ImmichAlbum = {
  id: string;
  albumName: string;
  description: string;
  assetCount: number;
  albumThumbnailAssetId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  shared?: boolean;
  albumUsers?: ImmichAlbumUser[];
};

export type ImmichSearchAssetsResponse = {
  assets: {
    items: ImmichAsset[];
    total: number;
  };
};

/** Duplicate group from `GET /api/duplicates` (Immich duplicate detection). */
export type ImmichDuplicateGroup = {
  duplicateId: string;
  assets: ImmichAsset[];
  suggestedKeepAssetIds?: string[];
};

export type ImmichActivityType = "comment" | "like";

export type ImmichActivity = {
  id: string;
  createdAt: string;
  albumId?: string;
  assetId?: string | null;
  comment?: string | null;
  type: ImmichActivityType;
  user: ImmichUser;
};

export type AssetUpdatePayload = {
  description?: string;
  localDateTime?: string;
};

export type ImmichPeopleResponse = {
  people: ImmichPerson[];
  hasNextPage: boolean;
  total: number;
  hidden?: number;
};

export type PersonUpdatePayload = {
  name?: string;
  birthDate?: string | null;
};
