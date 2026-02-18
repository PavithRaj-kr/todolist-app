"use client";

import { useTransition } from "react";
import { Loader2, Plus } from "lucide-react";

interface AddTodoProps {
    onAdd: (formData: FormData) => Promise<void>;
    isPending?: boolean;
}

export default function AddTodo({ onAdd, isPending = false }: AddTodoProps) {
    const [internalPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        // If the parent manages pending state, use it; otherwise use internal transition
        if (isPending) {
            onAdd(formData);
        } else {
            startTransition(() => {
                onAdd(formData);
            });
        }
    };

    const pending = isPending || internalPending;

    return (
        <div className="mb-10">
            <form action={handleSubmit} className="relative group">
                <input
                    name="text"
                    type="text"
                    placeholder="What needs to be done?"
                    required
                    disabled={pending}
                    className="w-full p-5 pl-6 pr-20 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm group-hover:shadow-md text-stone-800 placeholder:text-stone-400 disabled:opacity-50 text-lg"
                />
                <button
                    type="submit"
                    disabled={pending}
                    className="absolute right-3 top-3 bottom-3 bg-primary hover:bg-primary/90 text-white px-5 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-70 disabled:hover:shadow-none flex items-center justify-center"
                >
                    {pending ? <Loader2 className="animate-spin w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </button>
            </form>
        </div>
    );
}
