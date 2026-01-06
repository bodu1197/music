// ============================================
// YouTube Music Charts Configuration
// 62 Countries (61 Official + Global)
// Source: search/api/geolocation.php
// ============================================

export interface ChartConfig {
    topSongs: string;     // Top Songs playlist ID
    topVideos: string;    // Top Music Videos playlist ID
    trending?: string;    // Trending playlist ID (optional - not available for Global)
}

/**
 * YouTube Music Chart Playlist IDs by Country
 * These IDs are stable and rarely change
 */
export const CHART_CONFIGS: Record<string, ChartConfig> = {
    // === Global (No Trending available) ===
    ZZ: { topVideos: "PL4fGSI1pDJn5kI81J1fYWK5eZRl1zJ5kM", topSongs: "PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i" },

    // === 61 Official Chart Countries ===
    AR: { topVideos: "PL4fGSI1pDJn403fWAsjzCMsLEgBTOa25K", topSongs: "PL4fGSI1pDJn4Kd7YEG9LbUqvt64PLs9Fo", trending: "OLAK5uy_k5szwinemuiW7TfjD_5bUM4N13sNDw8-g" },
    AU: { topVideos: "PL4fGSI1pDJn44PMHPLYatj8rta8WYtZ8_", topSongs: "PL4fGSI1pDJn7xvYy-bP6UFeG5tITQgScd", trending: "OLAK5uy_nFGBM3omhVsEq3br7ph_ZoiW-H-TOv-kE" },
    AT: { topVideos: "PL4fGSI1pDJn42I7USCyNUQSjm-OlttqQf", topSongs: "PL4fGSI1pDJn6fFTVP30alDfSDAkEtHaNr", trending: "OLAK5uy_n-tkTtzlywZU-ukfYJW1USL81ICCVybpQ" },
    BE: { topVideos: "PL4fGSI1pDJn47l8EXIwa8SCWWjh79rgMq", topSongs: "PL4fGSI1pDJn64Up8Ds5BXizLBFZ922jHj", trending: "OLAK5uy_l9Kz6w9RL_hcupyIGHfa3p0RehsObGCto" },
    BO: { topVideos: "PL4fGSI1pDJn7ShAOJR2HPZrHb83DpSzV8", topSongs: "PL4fGSI1pDJn5Vi4RJX33LnETbjMhmPc9V", trending: "OLAK5uy_mWdMizxwrsdFaG6UFokkfF_yml3qHHGIU" },
    BR: { topVideos: "PL4fGSI1pDJn4Gs2meaJRo9O8PNYvhjHIg", topSongs: "PL4fGSI1pDJn7rGBE8kEC0CqTa1nMh9AKB", trending: "OLAK5uy_nxSJNrV0WQ9XbKv_4R9Y98EYwJnZBgkfg" },
    CA: { topVideos: "PL4fGSI1pDJn4IeWA7bBJYh__qgOCRMkIh", topSongs: "PL4fGSI1pDJn57Q7WbODbmXjyjgXi0BTyD", trending: "OLAK5uy_na07WEip9qUMd48VqOOws718WyFr0D0QQ" },
    CL: { topVideos: "PL4fGSI1pDJn4M3llRxwSebRSrjFqeNN3x", topSongs: "PL4fGSI1pDJn777t00zYu_BKjXHUdhkXH9", trending: "OLAK5uy_kycmGnT9aJX2zBi5nxqcO6b9p55V_S6hc" },
    CO: { topVideos: "PL4fGSI1pDJn4ObZYxzctc1AM45GSWm2DC", topSongs: "PL4fGSI1pDJn6CW97F1vSZOkoU7k7VsYk9", trending: "OLAK5uy_kcnWWQfQbentpiyNPEME69IkaOUqsq4Jw" },
    CR: { topVideos: "PL4fGSI1pDJn5DbEh-PXgn9ZInq-F3NSOZ", topSongs: "PL4fGSI1pDJn6U9fUfBkfy3uyXE7Rtvo4b", trending: "OLAK5uy_nJ93VQWNEyh89Ke2ELMhZLOKxTjWQTv6s" },
    CZ: { topVideos: "PL4fGSI1pDJn4PsD5Tua9nTgnPsP0o9_0k", topSongs: "PL4fGSI1pDJn5wV1AgglmIN_8okwTkz9WT", trending: "OLAK5uy_m3ud6eoJmyRFm7jnkVVctmbi9h8pDGJ7U" },
    DK: { topVideos: "PL4fGSI1pDJn4YoCXjBl6kg3DhYgUJTSfw", topSongs: "PL4fGSI1pDJn51jFsgXEIR7WdKBychJiMU", trending: "OLAK5uy_m6_9VbBHQcxvT0GgYMEMzqvS-WipQe8b4" },
    DO: { topVideos: "PL4fGSI1pDJn5yRDIISesmCXjor-3lw2ET", topSongs: "PL4fGSI1pDJn4C36SQoHh9fII-EXde2i3k", trending: "OLAK5uy_kFO5-FDfUcoR4dL8y5UqRtAWiw5hfVo-I" },
    EC: { topVideos: "PL4fGSI1pDJn4mwbdPq0EeOiD86MvMtkq0", topSongs: "PL4fGSI1pDJn7K4bdLZJ5GppzLDAihF58q", trending: "OLAK5uy_kYL-f0ZhzFr8TVYT7WtXmv3Zozg4cRJtY" },
    EG: { topVideos: "PL4fGSI1pDJn4EhpZkSSpdyWUet73FalVU", topSongs: "PL4fGSI1pDJn510j-1L8bMgKTyeRwPrXWY", trending: "OLAK5uy_lknTY9KFlbzbZ8CJ8Zchl1hx3G82pANTs" },
    SV: { topVideos: "PL4fGSI1pDJn59f4Ef4W3OgMW7HivJCrCt", topSongs: "PL4fGSI1pDJn6ALv-WRypOl0nGaLgtW6nC", trending: "OLAK5uy_mhu4EIZ8tUUWV3Dm1upbbwxPA2TIgmcng" },
    EE: { topVideos: "PL4fGSI1pDJn4fpNbyI8YHStVF-wyzHJtd", topSongs: "PL4fGSI1pDJn7uCBUO9GemJda1xfqmvV7_", trending: "OLAK5uy_lTtCDyNqLIg_ZQm0f73KjulbFPT7AFHQo" },
    FI: { topVideos: "PL4fGSI1pDJn4ogogSnHUTIWMc_b7pHW9A", topSongs: "PL4fGSI1pDJn4T5TECl_90hfJsPUu1yi2y", trending: "OLAK5uy_mkE4h6yaqbUYNbnhEKj11XBYgkPN9mwtM" },
    FR: { topVideos: "PL4fGSI1pDJn50iCQRUVmgUjOrCggCQ9nR", topSongs: "PL4fGSI1pDJn7bK3y1Hx-qpHBqfr6cesNs", trending: "OLAK5uy_mnRyLDuByhBA_r8-L9ugjllTxfVytwAp0" },
    DE: { topVideos: "PL4fGSI1pDJn4X-OicSCOy-dChXWdTgziQ", topSongs: "PL4fGSI1pDJn6KpOXlp0MH8qA9tngXaUJ-", trending: "OLAK5uy_nPQBmQpOIYYxuvYW4gIHsjgDqX9kc--Dg" },
    GT: { topVideos: "PL4fGSI1pDJn4MxjoamEWxTh5J7lw1JZfA", topSongs: "PL4fGSI1pDJn7NCQ_U0nwlhidgZ8E3uBQw", trending: "OLAK5uy_nDmXCB0yg-DTAzQIyrNXRZWOJPWtfVCA8" },
    HN: { topVideos: "PL4fGSI1pDJn5ESsEdE2R0v1nrLPIeM4Xx", topSongs: "PL4fGSI1pDJn5ZVtAKP9-OKnn09CJ-Znpt", trending: "OLAK5uy_mGctWnsB0YLoLYdcMv77VJJEjoF8urFx4" },
    HU: { topVideos: "PL4fGSI1pDJn6-AkuEzkhgTBJq3Lm0Oolc", topSongs: "PL4fGSI1pDJn6K3QY1nHyhOGQqNCBGbMKi", trending: "OLAK5uy_ntk96bAwMwhYqwiTKUUbPCpcJsbazi8M8" },
    IS: { topVideos: "PL4fGSI1pDJn5AT1xUL_xmiBWNqDv33giB", topSongs: "PL4fGSI1pDJn6pwJw_mb31TUqc9C_gpskG", trending: "OLAK5uy_kMssDwWTI5Fn7-90k8mIH_DozcsZNvu1Q" },
    IN: { topVideos: "PL4fGSI1pDJn40WjZ6utkIuj2rNg-7iGsq", topSongs: "PL4fGSI1pDJn4pTWyM3t61lOyZ6_4jcNOw", trending: "OLAK5uy_lSTp1DIuzZBUyee3kDsXwPgP25WdfwB40" },
    ID: { topVideos: "PL4fGSI1pDJn5QPpj0R4vVgRWk8sSq549G", topSongs: "PL4fGSI1pDJn5ObxTlEPlkkornHXUiKX1z", trending: "OLAK5uy_n7Ig_LAUbKE6_ZeQ1pwHmJcEhwX7BekBo" },
    IE: { topVideos: "PL4fGSI1pDJn574980IA4DVKDl8PDskrCj", topSongs: "PL4fGSI1pDJn5S_UFt83P-RlBC4CR3JYuo", trending: "OLAK5uy_lOTtAciVlrrKV5ivD--Vd74qzqeSf9uAw" },
    IL: { topVideos: "PL4fGSI1pDJn5xFol0l4GwBnHYtXXMaY82", topSongs: "PL4fGSI1pDJn4ECcNLNscMAPND-Degbd5N", trending: "OLAK5uy_mSuTPbhkJmOk5Hk21K2FKPv2rWx_5ag6w" },
    IT: { topVideos: "PL4fGSI1pDJn5BPviUFX4a3IMnAgyknC68", topSongs: "PL4fGSI1pDJn5JiDypHxveEplQrd7XQMlX", trending: "OLAK5uy_lOjIgcbrxv7bPplDRWt5bu9jLuye6bA8A" },
    JP: { topVideos: "PL4fGSI1pDJn5FhDrWnRp2NLzJCoPliNgT", topSongs: "PL4fGSI1pDJn4-UIb6RKHdxam-oAUULIGB", trending: "OLAK5uy_nMa6r07BbcC_Q8PrrS1CVHH2aGJRIkWu0" },
    KE: { topVideos: "PL4fGSI1pDJn5OYRHJhIu_bu7NRnkZ56ds", topSongs: "PL4fGSI1pDJn7z-3xqv1Ujjobcy2pjpZAA", trending: "OLAK5uy_ni8lYTKvlkPCbCr7SF9pYC9Y2Fuwu_R58" },
    KR: { topVideos: "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc", topSongs: "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", trending: "OLAK5uy_kdG4yl_RFDiVHXaqZaSFX1Gqenh8A98pM" },
    LU: { topVideos: "PL4fGSI1pDJn5Zla7aGxRJkvIbikXpf3VR", topSongs: "PL4fGSI1pDJn4ie_xg2ndQYSEeZrFYvkQf", trending: "OLAK5uy_neRQywabjdZB8BL-_oAauR6HlGJsOqg78" },
    MX: { topVideos: "PL4fGSI1pDJn5cDciLg1q9tabl7gzBZWOp", topSongs: "PL4fGSI1pDJn6fko1AmNa_pdGPZr5ROFvd", trending: "OLAK5uy_lC3dnKu2ub35dYnThuHgQarEVgkdHx1-k" },
    NL: { topVideos: "PL4fGSI1pDJn5i2QIxSEhPqSzhqsWhhrBJ", topSongs: "PL4fGSI1pDJn7CXu1B1U0lYQ0qfPB9TVfa", trending: "OLAK5uy_lODBFYhyNVz-TGrBj1hQP-LnBFQ-vZcJM" },
    NZ: { topVideos: "PL4fGSI1pDJn5yaX2-KEdvxQK0w938c-NX", topSongs: "PL4fGSI1pDJn6SZ8psSiS6j-QgUACJK4gC", trending: "OLAK5uy_lZ0EotKYlD1qzQm9Wb0Y0eu8_X8z86i-w" },
    NI: { topVideos: "PL4fGSI1pDJn49ZZQP_cqjJ6NvkJ-qf9sn", topSongs: "PL4fGSI1pDJn7eCAxG3AuCuottnW_D5C5w", trending: "OLAK5uy_n8D7En-nDthQlS9ybc6EogDwtl9fvC1hg" },
    NG: { topVideos: "PL4fGSI1pDJn5dHScZlGIe6TEoGzFv_qZE", topSongs: "PL4fGSI1pDJn6Au0oeuQPsd1iFyiU8Br9I", trending: "OLAK5uy_kK5Vb6sQxxX2HWLD2YhloS1BF6fJ_JIiM" },
    NO: { topVideos: "PL4fGSI1pDJn5qlG8HM7Iq54JE8SROhAvM", topSongs: "PL4fGSI1pDJn7ywehQhyuuPWo3ayrdSOHn", trending: "OLAK5uy_lhA-e7TewW4UIlJZcIvq-maNHFCUeGBZE" },
    PA: { topVideos: "PL4fGSI1pDJn5HtzpSBgS58MlBzOfKgqGw", topSongs: "PL4fGSI1pDJn4G4B-V4UTrxD7l5mE9cPS-", trending: "OLAK5uy_l300qWRA8ipi-MRkJYNIfWU7HedPImoMI" },
    PY: { topVideos: "PL4fGSI1pDJn5rl3PizG5yhj1R97Jl4vBq", topSongs: "PL4fGSI1pDJn5G0B8V2PSgs7O9EA4gF5m_", trending: "OLAK5uy_lTm4Z5k8nxzm4acrmvPuCY30BZKRbr6I4" },
    PE: { topVideos: "PL4fGSI1pDJn61j743B9r2LNeLCUUZsRMV", topSongs: "PL4fGSI1pDJn4k5jOJjYpq8pluME-gNAnh", trending: "OLAK5uy_kOhykI48RrrotDGkUMSgHmg_i0LI_TNgU" },
    PL: { topVideos: "PL4fGSI1pDJn69d7Zwro65Q7ORLxFVqr_U", topSongs: "PL4fGSI1pDJn68fmsRw9f6g-NzU5UA45v1", trending: "OLAK5uy_kUmlOeSMX6tflypRbym_yaY6idzKhE9sE" },
    PT: { topVideos: "PL4fGSI1pDJn6G_VdIB6wxGYzuai0iA1hC", topSongs: "PL4fGSI1pDJn7H0X0bZN4C-I6YeldOvPku", trending: "OLAK5uy_kwrUiy0rYeEZVKBD_dC-ry0s6pT54SrMs" },
    RO: { topVideos: "PL4fGSI1pDJn6L8lQpfbnXpXUR71uksmP2", topSongs: "PL4fGSI1pDJn5G2T6hrqwSS7ajUA7y4S5l", trending: "OLAK5uy_lcrATJDe23r1ypBltst3R6P7UTJSPdNas" },
    RU: { topVideos: "PL4fGSI1pDJn6cLcPmcc9b_l8oM0aJtsqL", topSongs: "PL4fGSI1pDJn5C8dBiYt0BTREyCHbZ47qc", trending: "OLAK5uy_k_k7U-B1B9_Coz_rGcNdMqx7dfweJaaRI" },
    RS: { topVideos: "PL4fGSI1pDJn6WdZq272-vbCc5SJ1zxzbC", topSongs: "PL4fGSI1pDJn79dpGvfySMY9w43BluD4lI", trending: "OLAK5uy_kksagOKE6MuEDMX1D_vTIlnUaBUmBFEkw" },
    SA: { topVideos: "PL4fGSI1pDJn7b8BNLVP8XUrJCQp_loKZT", topSongs: "PL4fGSI1pDJn7xNK-XdqvCsqa7I8Nx3IyW", trending: "OLAK5uy_mOIVapRHtjxkC_LwcpNGtGEFnCkkJ4wJo" },
    ZA: { topVideos: "PL4fGSI1pDJn79YvDK-Dq95SAW1V28wnns", topSongs: "PL4fGSI1pDJn7xvqMZR_9OgljLcMQpuKXN", trending: "OLAK5uy_mumFChbJUINThMILl9CrF0eB5dhBpXpSw" },
    ES: { topVideos: "PL4fGSI1pDJn4jhQB4kb9M36dvVmJQPt4T", topSongs: "PL4fGSI1pDJn6sMPCoD7PdSlEgyUylgxuT", trending: "OLAK5uy_mzYnlaHgFOvLaxqIPnnouEr-idiUn4NIM" },
    SE: { topVideos: "PL4fGSI1pDJn6l_eirqF_T40p1B8eJg2Pz", topSongs: "PL4fGSI1pDJn7S_JFSuBHol2RH9WphaqzS", trending: "OLAK5uy_kVyz7tTEfELB8vPVMVV2u93B944Oe1GLU" },
    CH: { topVideos: "PL4fGSI1pDJn4KBb656ZmzFTCGK0eAv5bu", topSongs: "PL4fGSI1pDJn6Nhmcqn4xr769wwoMmS3DI", trending: "OLAK5uy_kEKZHvTgtm7yqU2CbDXdCz8WDkDuXbv7s" },
    TZ: { topVideos: "PL4fGSI1pDJn7-3qlPahSCN5PagP0L1p6r", topSongs: "PL4fGSI1pDJn4CI0qH2JZYs2qGXo1itpCG", trending: "OLAK5uy_lC2yo7wWtJy0Cq1WFPuApx-1Qb2KVTHUg" },
    TR: { topVideos: "PL4fGSI1pDJn6rnJKpaAkK1XK8QUfa9KqP", topSongs: "PL4fGSI1pDJn5tdVDtIAZArERm_vv4uFCR", trending: "OLAK5uy_mFBgHnPi7PIkt7vlG84rCduzVjFtuHnpM" },
    UG: { topVideos: "PL4fGSI1pDJn75xappx8QlV4-0nuyXlDAr", topSongs: "PL4fGSI1pDJn56127QXqxGADbedOpL5z5R", trending: "OLAK5uy_llg5xHJ1W1hh8AHuEjErHyblMREgeZEK8" },
    UA: { topVideos: "PL4fGSI1pDJn7524WZdmWAIRc6cQ3vUzZK", topSongs: "PL4fGSI1pDJn4E_HoW5HB-w5vFPkYfo3dB", trending: "OLAK5uy_m0nbJnDkpubmcRw6CvhS0-btqfnpXxbog" },
    AE: { topVideos: "PL4fGSI1pDJn4CDqdXJ4xP78Hh7X72vIXM", topSongs: "PL4fGSI1pDJn71VxNxT-PpECxHCVv8T-oX", trending: "OLAK5uy_kw9ls1OPNCzxv84t3N-USk00zpIgP_s1Q" },
    GB: { topVideos: "PL4fGSI1pDJn688ebB8czINn0_nov50e3A", topSongs: "PL4fGSI1pDJn6_f5P3MnzXg9l3GDfnSlXa", trending: "OLAK5uy_l20GN5f5o5iub9vasQj2Jz5r5uEBcLqPI" },
    US: { topVideos: "PL4fGSI1pDJn69On1f-8NAvX_CYlx7QyZc", topSongs: "PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI", trending: "OLAK5uy_kNWGJvgWVqlt5LsFDL9Sdluly4M8TvGkM" },
    UY: { topVideos: "PL4fGSI1pDJn5giLQO3qUCqpp_MSDRmJNA", topSongs: "PL4fGSI1pDJn5caN5mlO8NWCPSyuHkQANg", trending: "OLAK5uy_mRrCYHSfwuHSizEGSqCyTpWJmrPBMhTF8" },
    ZW: { topVideos: "PL4fGSI1pDJn7HuQm191bZDx7ZMMgk9-Bp", topSongs: "PL4fGSI1pDJn7PWidyUayXX6-josrejRMG", trending: "OLAK5uy_ndXLe9NXleVXZiPlURIIlyGGqSmO90f2k" },

    // === Smart Mapping Countries (Use nearest cultural match) ===
    HK: { topVideos: "PL4fGSI1pDJn5FhDrWnRp2NLzJCoPliNgT", topSongs: "PL4fGSI1pDJn4-UIb6RKHdxam-oAUULIGB", trending: "OLAK5uy_nMa6r07BbcC_Q8PrrS1CVHH2aGJRIkWu0" }, // -> JP
    CN: { topVideos: "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc", topSongs: "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", trending: "OLAK5uy_kdG4yl_RFDiVHXaqZaSFX1Gqenh8A98pM" }, // -> KR
    TW: { topVideos: "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc", topSongs: "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", trending: "OLAK5uy_kdG4yl_RFDiVHXaqZaSFX1Gqenh8A98pM" }, // -> KR
    VN: { topVideos: "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc", topSongs: "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", trending: "OLAK5uy_kdG4yl_RFDiVHXaqZaSFX1Gqenh8A98pM" }, // -> KR
    TH: { topVideos: "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc", topSongs: "PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m", trending: "OLAK5uy_kdG4yl_RFDiVHXaqZaSFX1Gqenh8A98pM" }, // -> KR
    MY: { topVideos: "PL4fGSI1pDJn5QPpj0R4vVgRWk8sSq549G", topSongs: "PL4fGSI1pDJn5ObxTlEPlkkornHXUiKX1z", trending: "OLAK5uy_n7Ig_LAUbKE6_ZeQ1pwHmJcEhwX7BekBo" }, // -> ID
    SG: { topVideos: "PL4fGSI1pDJn5QPpj0R4vVgRWk8sSq549G", topSongs: "PL4fGSI1pDJn5ObxTlEPlkkornHXUiKX1z", trending: "OLAK5uy_n7Ig_LAUbKE6_ZeQ1pwHmJcEhwX7BekBo" }, // -> ID
    PH: { topVideos: "PL4fGSI1pDJn69On1f-8NAvX_CYlx7QyZc", topSongs: "PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI", trending: "OLAK5uy_kNWGJvgWVqlt5LsFDL9Sdluly4M8TvGkM" }, // -> US
};

/**
 * Get chart configuration for a country
 * Falls back to Global (ZZ) if country not supported
 */
export function getChartConfig(countryCode: string): ChartConfig {
    return CHART_CONFIGS[countryCode] || CHART_CONFIGS.ZZ;
}

/**
 * Check if a country has chart support
 */
export function hasChartSupport(countryCode: string): boolean {
    return countryCode in CHART_CONFIGS;
}

/**
 * Get all supported chart countries
 */
export function getSupportedChartCountries(): string[] {
    return Object.keys(CHART_CONFIGS);
}
