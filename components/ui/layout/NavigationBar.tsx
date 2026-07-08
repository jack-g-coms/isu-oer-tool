"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

import { getInitials } from "@/lib/utils/strings";

import { Brain, GraduationCap, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import LinkButton from "../input/LinkButton";
import Button from "../input/Button";

export default function NavigationBar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <div className="lg:hidden px-5 md:px-10 py-3 top-0 sticky bg-white border-b border-gray-200">
                <div className="flex flex-row justify-between">
                    <div className="flex flex-row gap-3 items-center">
                        <Image
                            src="/images/isu-logo.png"
                            alt="ISU logo"
                            width={45}
                            height={45}
                        />
                        <h1 className="text-xl font-semibold tracking-wider">OER Textbook Builder</h1>
                    </div>

                    <button
                        type="button"
                        className="cursor-pointer lg:hidden"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}    
                    >
                        {mobileMenuOpen ? 
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>    
                        :
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        }  
                    </button>
                </div>
            </div>

            <div className={`${mobileMenuOpen ? "fixed top-14 z-50 w-full" : "hidden"} lg:flex flex-col lg:w-full lg:max-w-xs min-h-screen bg-white border-b border-r border-gray-200`}>
                <div className="hidden lg:flex flex-row gap-4 border-b border-gray-200 px-6 pb-2">
                    <Image 
                        src="/images/isu-logo.png"
                        width={0}
                        height={0}
                        alt="ISU logo"
                        sizes="100vw"
                        style={{ width: "70px", height: "100%" }}
                    />

                    <div className="flex flex-col my-2">
                        <h1 className="text-xl font-bold tracking-tight">OER</h1>
                        <h1 className="text-[var(--isu-cardinal)] text-lg font-semibold tracking-tight">Textbook Builder</h1>
                    </div>
                </div>

                <div className="px-4 space-y-2 py-4">
                    <LinkButton
                        href="/dashboard"
                        active={pathname == "/dashboard"}
                    >
                        <LayoutDashboard width={20} height={20}/> Dashboard
                    </LinkButton>

                    <LinkButton
                        href="/knowledge"
                        active={pathname == "/knowledge"}
                    >
                        <Brain width={20} height={20}/> Knowledge
                    </LinkButton>

                    <LinkButton
                        href="/textbooks"
                        active={pathname == "/textbooks"}
                    >
                        <GraduationCap width={20} height={20}/> Textbooks
                    </LinkButton>
                </div>

                <div className="mt-auto border-t border-gray-200 px-4 py-4 space-y-4">
                    <div className="flex flex-row gap-4 items-center w-full">
                        <div className="w-12 h-12">
                            {!session?.user.image && session?.user.name ?
                                <div className="bg-[var(--isu-cardinal)] h-full w-full rounded-full text-white flex items-center justify-center">
                                    <p>{getInitials(session?.user.name)}</p>
                                </div>
                            : session?.user.image ? 
                                <div className="relative rounded-full h-full w-full overflow-hidden">
                                    <Image
                                        src={session?.user.image}
                                        fill
                                        alt="User profile picture"
                                    />
                                </div>
                            : 
                                <div className="w-full h-full rounded-full bg-gray-300" />
                            }
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                            <h2 className="text-md font-semibold truncate">{session?.user.name}</h2>
                            <h3 className="text-sm truncate">{session?.user.email}</h3>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Button 
                            onClick={() => signOut({
                                callbackUrl: "/"
                            })}
                            variant="clear"
                        >
                            <LogOut width={20} height={20}/> Sign Out
                        </Button>

                        <Button variant="clear">
                            <Settings width={20} height={20}/> Settings
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}