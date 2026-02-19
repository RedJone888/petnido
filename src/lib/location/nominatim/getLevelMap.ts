import { LevelMap } from "@/domain/location/types";
import { DEFAULT_LEVEL_MAP, JP_LEVEL_MAP } from "@/domain/location/constants";

export function getLevelMap(countryCode?: string): LevelMap {
  switch (countryCode) {
    case "jp":
      return JP_LEVEL_MAP;

    default:
      return DEFAULT_LEVEL_MAP;
  }
}
