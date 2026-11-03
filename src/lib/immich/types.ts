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
};

export type ImmichExif = {
  imageWidth?: number;
  imageHeight?: number;
  city?: string | null;
  country?: string | null;
};

export type ImmichAsset = {
  id: string;
  originalFileName: string;
  fileCreatedAt: string;
  localDateTime: string;
  updatedAt: string;
  description?: string;
  tags?: ImmichTag[];
  exifInfo?: ImmichExif | null;
  isArchived?: boolean;
  isFavorite?: boolean;
  type?: string;
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
