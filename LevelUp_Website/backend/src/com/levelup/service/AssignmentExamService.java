package com.levelup.service;

import com.levelup.dao.AssignmentExamDao;
import com.levelup.dao.SubjectDao;
import com.levelup.exception.DaoException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.model.AcademicItem;
import com.levelup.model.Assignment;
import com.levelup.model.Exam;
import com.levelup.model.Subject;
import com.levelup.util.ValidationUtil;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class AssignmentExamService {

    private final AssignmentExamDao dao = new AssignmentExamDao();
    private final SubjectDao subjectDao = new SubjectDao();

    public List<AcademicItem> listAll(int userId, String typeFilter) throws DaoException {
        if (typeFilter != null && !typeFilter.isEmpty()) return dao.findByType(userId, typeFilter);
        return dao.findAll(userId);
    }

    public AcademicItem get(int userId, int id) throws DaoException {
        AcademicItem item = dao.findById(userId, id);
        if (item == null) throw new ResourceNotFoundException("Assignment/Exam " + id + " not found");
        return item;
    }

    public AcademicItem create(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String title = ValidationUtil.requireNonEmptyString(body, "title", errors);
        LocalDate dueDate = ValidationUtil.requireDate(body, "dueDate", errors);
        String itemType = ValidationUtil.optionalString(body, "itemType");
        ValidationUtil.requireOneOf(itemType, "itemType", errors, "assignment", "exam");
        ValidationUtil.throwIfErrors(errors);

        Subject subject = resolveSubject(userId, body);
        String description = ValidationUtil.optionalString(body, "description");
        double weight = ValidationUtil.optionalDouble(body, "weight", 0);

        AcademicItem item = buildFromType(itemType, title, description, dueDate, subject, weight, body);
        return dao.create(userId, item);
    }

    public AcademicItem update(int userId, int id, Map<String, Object> body) throws DaoException {
        AcademicItem existing = get(userId, id);
        List<String> errors = ValidationUtil.newErrorList();

        if (body.containsKey("title")) existing.setTitle(ValidationUtil.requireNonEmptyString(body, "title", errors));
        if (body.containsKey("description")) existing.setDescription(ValidationUtil.optionalString(body, "description"));
        if (body.containsKey("dueDate")) existing.setDueDate(ValidationUtil.optionalDate(body, "dueDate", errors));
        if (body.containsKey("subjectId")) existing.setSubject(resolveSubject(userId, body));
        ValidationUtil.throwIfErrors(errors);

        if (existing instanceof Assignment) {
            Assignment a = (Assignment) existing;
            if (body.containsKey("weight")) a.setWeight(ValidationUtil.optionalDouble(body, "weight", a.getWeight()));
            if (body.containsKey("submissionStatus")) a.setSubmissionStatus(ValidationUtil.optionalString(body, "submissionStatus"));
        } else if (existing instanceof Exam) {
            Exam ex = (Exam) existing;
            if (body.containsKey("weight")) ex.setWeight(ValidationUtil.optionalDouble(body, "weight", ex.getWeight()));
            if (body.containsKey("venue")) ex.setVenue(ValidationUtil.optionalString(body, "venue"));
            if (body.containsKey("examType")) ex.setExamType(ValidationUtil.optionalString(body, "examType"));
        }

        dao.update(userId, existing);
        return existing;
    }

    public void delete(int userId, int id) throws DaoException {
        get(userId, id);
        dao.delete(userId, id);
    }

    public List<AcademicItem> listUpcomingExams(int userId) throws DaoException {
        return dao.findByType(userId, "exam");
    }

    private AcademicItem buildFromType(String itemType, String title, String description, LocalDate dueDate,
                                        Subject subject, double weight, Map<String, Object> body) {
        if ("exam".equals(itemType)) {
            String venue = ValidationUtil.optionalString(body, "venue");
            String examType = ValidationUtil.optionalString(body, "examType");
            return new Exam(title, description, dueDate, subject, weight, venue, examType);
        }
        String submissionStatus = ValidationUtil.optionalString(body, "submissionStatus");
        if (submissionStatus == null) submissionStatus = "not_started";
        return new Assignment(title, description, dueDate, subject, weight, submissionStatus);
    }

    private Subject resolveSubject(int userId, Map<String, Object> body) throws DaoException {
        Integer subjectId = ValidationUtil.optionalInt(body, "subjectId");
        if (subjectId == null) return null;
        Subject subject = subjectDao.findById(userId, subjectId);
        if (subject == null) throw new ResourceNotFoundException("Subject " + subjectId + " not found");
        return subject;
    }
}
