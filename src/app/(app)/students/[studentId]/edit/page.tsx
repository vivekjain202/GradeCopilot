import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthenticatedTeacher } from "@/lib/authorization";
import { findStudent } from "@/lib/students/repository";
import { updateStudentAction } from "../../actions";
import { StudentForm } from "../../_components/student-form";
export const dynamic = "force-dynamic";
export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const teacher = await getAuthenticatedTeacher();
  if (!teacher) redirect("/login");
  const student = await findStudent(teacher.id, studentId);
  if (!student) notFound();
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link className="text-sm font-medium text-indigo-700" href="/students">
        ← Students
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Edit {student.name}</h1>
      <div className="mt-8">
        <StudentForm
          action={updateStudentAction.bind(null, student.id)}
          student={{
            name: student.name,
            className: student.className,
            rollNumber: student.rollNumber ?? "",
            guardianEmail: student.guardianEmail ?? "",
          }}
        />
      </div>
    </main>
  );
}
