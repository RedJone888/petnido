import { describe, expect, it } from "vitest";

import { nominatimToUx } from "./nominatimToUx";

const station = {
  osm_type: "node",
  osm_id: 1,
  class: "railway",
  type: "station",
  name: "Tokyo",
  lat: "35.681236",
  lon: "139.767125",
  address: {
    country_code: "jp",
    country: "Japan",
    province: "Tokyo",
    city: "Chiyoda",
  },
};

describe("localized Nominatim labels", () => {
  it.each([
    ["en", "Tokyo Station"],
    ["zh", "Tokyo站"],
    ["ja", "Tokyo駅"],
  ] as const)("formats station results for %s", (language, expected) => {
    expect(nominatimToUx([station], "", language)[0]?.label).toBe(expected);
  });

  it("does not duplicate an English station suffix", () => {
    expect(
      nominatimToUx(
        [{ ...station, name: "Tokyo Station" }],
        "",
        "en",
      )[0]?.label,
    ).toBe("Tokyo Station");
  });

  it("keeps a separate city-and-district label for public marketplace cards", () => {
    const result = nominatimToUx([{
      ...station,
      name: "Hanshin Expressway Route 2 Yodogawa-Sagan Line",
      type: "road",
      address: {
        country_code: "jp",
        country: "日本",
        province: "大阪府",
        city: "大阪市",
        city_district: "此花区",
        road: "阪神高速2号淀川左岸線",
      },
    }], "", "zh")[0];

    expect(result?.label).toBe("Hanshin Expressway Route 2 Yodogawa-Sagan Line");
    expect(result?.regionLabel).toBe("大阪府大阪市此花区");
  });

  it("keeps Tokyo together with its ward in the public region label", () => {
    const result = nominatimToUx([{
      ...station,
      name: "目黒区",
      type: "administrative",
      address: {
        country_code: "jp",
        country: "日本",
        province: "東京都",
        city_district: "目黒区",
      },
    }], "", "ja")[0];

    expect(result?.regionLabel).toBe("東京都目黒区");
  });

  it("retains multiple distinct search results without collapsing to one", () => {
    const rawResults = [
      {
        place_id: 101,
        osm_type: "relation",
        osm_id: 1001,
        class: "boundary",
        type: "administrative",
        name: "北京市",
        lat: "39.906217",
        lon: "116.3912757",
        address: {
          country_code: "cn",
          country: "中国",
          city: "北京市",
        },
      },
      {
        place_id: 102,
        osm_type: "relation",
        osm_id: 1002,
        class: "boundary",
        type: "administrative",
        name: "海淀区",
        lat: "39.9599",
        lon: "116.298",
        address: {
          country_code: "cn",
          country: "中国",
          city: "北京市",
          city_district: "海淀区",
        },
      },
      {
        place_id: 103,
        osm_type: "relation",
        osm_id: 1003,
        class: "boundary",
        type: "administrative",
        name: "朝阳区",
        lat: "39.9215",
        lon: "116.4431",
        address: {
          country_code: "cn",
          country: "中国",
          city: "北京市",
          city_district: "朝阳区",
        },
      },
    ];

    const results = nominatimToUx(rawResults, "北京", "zh");
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.label)).toEqual(["北京市", "海淀区", "朝阳区"]);
  });
});
