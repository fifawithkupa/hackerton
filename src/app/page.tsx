import { redirect } from "next/navigation";

/** SSATIS 메인 UI는 painpoint/ 정적 앱에서 제공됩니다. */
export default function HomePage() {
  redirect("/painpoint/index.html");
}
