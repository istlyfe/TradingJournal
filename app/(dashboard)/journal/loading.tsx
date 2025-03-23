import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

export default function JournalLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Trading Journal</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[144px] w-full" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-40" />
        </div>
        
        <div className="grid gap-2">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>
  );
} 