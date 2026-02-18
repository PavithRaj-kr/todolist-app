"use client";

import { useTransition } from "react";
import { Check, Trash2 } from "lucide-react";

interface TodoItemProps {
    todo: {
        id: number;
        text: string;
        completed: boolean;
    };
    onToggle: (id: number, completed: boolean) => void;
    onDelete: (id: number) => void;
    isPending?: boolean;
}

export default function TodoItem({ todo, onToggle, onDelete, isPending = false }: TodoItemProps) {
    const [internalPending, startTransition] = useTransition();

    // We can just call the handlers directly as they are expected to handle the transitions or be server actions wrapped in form actions
    // wrapper to allow using form action if we want, but purely onClick is cleaner for the UI interactions here

    const handleToggle = () => {
        if (isPending || internalPending) return;
        startTransition(() => {
            onToggle(todo.id, todo.completed);
        });
    }

    const handleDelete = () => {
        if (isPending || internalPending) return;
        startTransition(() => {
            onDelete(todo.id);
        });
    }

    const pending = isPending || internalPending;

    return (
        <li
            className={`group flex items-center justify-between bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 ${pending ? "opacity-50 scale-[0.99]" : ""
                }`}
        >
            <div className="flex items-center gap-5 flex-1">
                <button
                    onClick={handleToggle}
                    disabled={pending}
                    className={`w-7 h-7 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${todo.completed
                            ? "bg-green-600 border-green-600 text-white scale-110 shadow-sm"
                            : "border-stone-300 hover:border-primary hover:bg-primary/5"
                        }`}
                >
                    {todo.completed && <Check size={16} strokeWidth={3} />}
                </button>

                <span
                    className={`text-lg font-medium transition-all duration-300 ${todo.completed ? "line-through text-stone-400" : "text-stone-700"
                        }`}
                >
                    {todo.text}
                </span>
            </div>

            <button
                onClick={handleDelete}
                disabled={pending}
                className="text-stone-300 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                aria-label="Delete task"
            >
                <Trash2 size={20} />
            </button>
        </li>
    );
}
