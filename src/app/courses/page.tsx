import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Show, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import PurchaseButton from "../components/PurchaseButton"; 

const page = async () => {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const courses = await convex.query(api.courses.getCourses);

  return (
    <div className="container mx-auto pb-40 sm:py-8 px-4 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">All Courses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course._id} className="flex flex-col">
            <Link href={`/courses/${course._id}`} className="cursor-pointer">
              <CardHeader>
                <Image
                  src={course.imageUrl}
                  alt={course.title}
                  width={640}
                  height={360}
                  className="rounded-md object-cover"
                />
              </CardHeader>
              <CardContent className="flex-grow">
                <CardTitle className="text-xl mb-2 hover:underline">
                  {course.title}
                </CardTitle>
              </CardContent>
            </Link>

            <CardFooter className="flex justify-between items-center">
              <Badge asChild variant="default" className="text-lg px-3">
                <span>${course.price.toFixed(2)}</span>
              </Badge>
              <Show when={"signed-in"} fallback={null}>
                <Show when={"signed-out"} fallback={null}>
                  <SignInButton mode="modal">
                    <Button variant="outline">Enroll Now</Button>
                  </SignInButton>
                </Show>
                <Show when={"signed-in"}>
                  <PurchaseButton courseId={course._id} />
                </Show>
              </Show>

              <Show when={"signed-out"}>
                <SignInButton mode="modal">
                </SignInButton>
              </Show>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default page;
