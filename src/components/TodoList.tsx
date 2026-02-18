"use client";

import TodoItem from "./TodoItem";

interface TodoListProps {
    todos: any[];
    onToggle: (id: number, completed: boolean) => void;
    onDelete: (id: number) => void;
    isPending?: boolean;
}

export default function TodoList({ todos, onToggle, onDelete, isPending }: TodoListProps) {
    if (todos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <span className="text-4xl">✨</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                <p className="text-gray-500 mt-1">You have no tasks on your list.</p>
            </div>
        );
    }

    return (
        <ul className="space-y-3">
            {todos.map((todo) => (
                <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    isPending={isPending}
                />
            ))}
        </ul>
    );
}
