import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Quiz Battle Arena — Play with friends',description:'Ten questions. One arena. Create a room and challenge 2–8 friends to a live trivia battle. No login required.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
