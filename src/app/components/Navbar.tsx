import {
  Show,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import {
  BookOpenIcon,
  CreditCardIcon,
  GraduationCap,
  LogOutIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="max-w-[1560px] mx-auto flex justify-between items-center py-4 px-3 sm:px-6 bg-background border-b">
      <Link
        href={"/"}
        className="text-xl font-extrabold text-primary flex items-center gap-2"
      >
        <span className="hidden sm:inline">MasterClass</span> <GraduationCap className="size-7" />
      </Link>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <Link
          href={"/courses"}
          className="flex items-center gap-1 px-3 py-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
        >
          <BookOpenIcon className="size-6" />
          <span className="hidden sm:inline">Courses</span>
        </Link>

        <Link
          href={"/pro"}
          className="flex items-center gap-1 px-3 py-2 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
        >
          <ZapIcon className="size-6" />
          <span className="hidden sm:inline">Pro</span>
        </Link>

        <Show when={"signed-in"}>
          <Link href={"/billing"}>
            <Button 
              size={"sm"}
              className="flex items-center gap-2 text-black"
            >
              <CreditCardIcon className="size-6" />
              <span className="hidden sm:inline">Billing</span>
            </Button>
          </Link>
        </Show>

        {/* this will only be shown if user is signed in */}
        <UserButton />

        <Show when={"signed-in"}>
          <SignOutButton>
            <Button
              variant="outline" 
              className="flex items-center gap-2 text-black rounded-md"
            >
              <LogOutIcon className="h-6 w-6" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </SignOutButton>
        </Show>

        <Show when={"signed-out"}>
          <>
            <SignInButton mode="modal">
              <Button variant="outline" className="rounded-md" size="lg">
                Log in
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button variant="outline" className="rounded-md" size="lg">
                Sign Up
              </Button>
            </SignUpButton>
          </>
        </Show>
      </div>
    </nav>
  );
};
export default Navbar;
