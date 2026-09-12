import { Link } from 'react-router-dom';
import { useExamList } from '../hooks/useExams';
import { ExamStatusBadge } from '../components/ExamStatusBadge';

export function ExamListPage() {
  const { data: exams, isLoading, isError } = useExamList();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Exams</h1>
          <p>Create and manage question paper exams.</p>
        </div>
        <Link to="/staff/exams/new">
          <button>+ New Exam</button>
        </Link>
      </div>

      {isLoading && <div className="loading"><span className="spinner" /> Loading exams…</div>}
      {isError && <div className="alert alert-error">Could not load exams.</div>}

      {exams && exams.length === 0 && (
        <div className="empty-state">No exams yet. Create your first exam.</div>
      )}

      {exams && exams.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Academic Year</th>
              <th>Marks</th>
              <th>Questions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td>
                  <Link to={`/staff/exams/${exam.id}`}><strong>{exam.name}</strong></Link>
                </td>
                <td>{exam.className}</td>
                <td>{exam.subjectName}</td>
                <td>{exam.academicYearLabel}</td>
                <td>{exam.totalMarks ?? '—'}</td>
                <td>{exam.questionCount}</td>
                <td><ExamStatusBadge status={exam.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}