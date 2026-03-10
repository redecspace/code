import Image from "next/image";
import Link from "next/link";
import { APP_NAME, WEB_DOMAIN } from "@/data/constants";

const Copyright = () => {
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo.png" alt={APP_NAME} width={25} height={25} />
      &copy;{" "}
      <Link
        href={"/"}
        className="inline hover:underline hover:text-foreground text-sm"
      >
        {WEB_DOMAIN as string}
      </Link>
    </div>
  );
};

export default Copyright;
