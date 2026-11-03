/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string
  readonly MAPBOX_ACCESS_TOKEN?: string
  readonly VITE_BLOCK_GROUPS_TILESET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
