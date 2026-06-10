import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import Image from "next/image";

export default async function Home() {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const courses = (await convex.query(api.courses.getCourses)) as any;
  return (
    <main className="flex flex-col items-center justify-between min-h-full p-4">
      <div className="flex flex-col items-center gap-2 mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-center">
          Welcome to the Stripe Payments Example
        </h1>
        <p className="text-lg text-muted-foreground">
          Use the navigation bar to explore the app.
        </p>
      </div>

      <ul className="flex flex-wrap justify-center gap-3">
        {courses.map((course: any) => (
          <li
            key={course._id}
            className="border p-4 rounded mb-4 w-full max-w-md min-h-0 flex flex-col gap-3"
          >
            <Image
              width={640}
              height={360}
              src={course.imageUrl}
              alt={course.title}
              className="w-full mb-2"
            />
            <h2 className="text-2xl font-semibold">{course.title}</h2>
            <p className="text-gray-600">{course.description}</p>
            <p className="text-lg font-bold mt-auto">${course.price.toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
