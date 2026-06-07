"use client"

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Input from "@/components/ui/input/Input";
import Button from "@/components/ui/input/Button";
import Image from "next/image";

export default function SignIn() {
  const router = useRouter();

  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    if (loading) return;
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      redirect: false
    });
    setLoading(false);
  
    if (result?.ok) {
      router.push("/dashboard");
      toast.success(`Signed In!`)
    } else {
      toast.error("Failed to login")
    }
  }

  useEffect(() => {
    /*if (status == "authenticated") {
      router.push("/dashboard");
    }*/
  }, [status]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full h-full md:h-fit md:max-w-lg rounded-lg border border-gray-200 bg-white py-8 px-8 shadow-lg space-y-6">
        <div className="w-full flex items-center justify-center">
          <Image 
            src="/images/isu-banner.png"
            width={0}
            height={0}
            alt="ISU banner"
            sizes="100vw"
            style={{ width: "245px", height: "36px" }}
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-center">OER Textbook Builder</h1>
          <h2 className="text-2xl font-semibold text-center">Welcome back!</h2>
        </div>

        <Input 
          label="Email"
          type="email"
          placeholder="Enter your Iowa State Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" variant="primary" loading={loading}>
          Sign in with Iowa State
        </Button>
      </form>
    </div>
  );
}