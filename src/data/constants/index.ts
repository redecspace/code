import { tools } from "../tools";

export const APP_NAME = "Redec";
export const APP_TITLE = `${APP_NAME} - Free & Open source Tools for Everyone`;
export const SITE_NAME = `${APP_NAME} - Tools For You`;
export const SOCIAL_HANDLE = "@redecspace";

export const WEB_PROTOCOL = "https";
export const WEB_DOMAIN = "redec.space";
export const WEB_URL = `${WEB_PROTOCOL}://${WEB_DOMAIN}`;

export const SUPPORT_EMAIL = `support@redec.space`;

export const NEXT_PUBLIC_GOOGLE_CLIENT_ID =
  "622854070021-3boporbbbh3em3u4f6b4k44idbpb0i26.apps.googleusercontent.com";

export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.BASE_URL || WEB_URL
    : "http://localhost:3000";
export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://redec.space/api"
    : "http://localhost:8000";

export const GTM_ID = "GTM-KQHQ5945";

export const placeholderImage = "/placeholder.svg";

export const rgbDataURL = (r: number, g: number, b: number) => {
  const keyStr =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const triplet = (e1: number, e2: number, e3: number) =>
    keyStr.charAt(e1 >> 2) +
    keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
    keyStr.charAt(((e3 & 15) << 2) | (e3 >> 6)) +
    keyStr.charAt(e3 & 63);
  return `data:image/gif;base64,R0lGODlhAQABAPAA${
    triplet(0, r, g) + triplet(b, 255, 255)
  }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`;
};

const toolRoutes = tools.flatMap((category) =>
  category.items.map((item) => 
   `${item.url}`,
  ) ,
);

export const SEO = {
  routes: [
    "/",
    ...toolRoutes
  ],

  metadata: {
    icons: {
      icon: "/logo.png",
    },

    title: APP_TITLE,
    description: `${APP_NAME} provides a growing collection of free, fast, and secure online and Open source tools. Convert, generate, create, calculate and analyze effortlessly.`,
    keywords: [
      "free online tools",
      "pdf tools",
      "all in one",
      "all in one tools",
      "img tools",
      "image tools",
      "compressor",
      "web tools",
      "seo tools",
      "dev tools",
      "calculator",
      "unit converter",
      "password generator",
      "qr code generator",
      "pdf convertor",
      "pdf merge",
      "remove bg",
      "i love pdf",
      "smallpdf",
      "pdf editor",
      "word counter",
      "text analyzer",
      "developer tools",
      "productivity tools",
      "Redec",
      "redecspace",
      "redec tools",
      "online utility tools",
    ],

    openGraph: {
      type: "website",
      locale: "en_US",
      url: BASE_URL,
      siteName: SITE_NAME,
      title: APP_TITLE,
      description: `Access a variety of free and Open source tools on ${APP_NAME}. From unit conversion to secure password generation, we've got you covered.`,
      images: [
        {
          url: `${BASE_URL}/og.svg`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      site: SOCIAL_HANDLE,
      creator: SOCIAL_HANDLE,
      title: APP_TITLE,
      siteName: SITE_NAME,
      description: `Fast, free, and secure Open source tools on ${APP_NAME}. No sign-up required.`,
      images: [
        {
          url: `${BASE_URL}/og.svg`,
          alt: SITE_NAME,
        },
      ],
    },

    robots: {
      index: true,
      follow: true,
      nocache: false,
    },

    alternates: {
      canonical: BASE_URL,
    },
  },
};
