package com.levelup.service;

import com.levelup.dao.SubjectDao;
import com.levelup.exception.DaoException;
import com.levelup.exception.ResourceNotFoundException;
import com.levelup.exception.ValidationException;
import com.levelup.model.Subject;
import com.levelup.util.ValidationUtil;

import java.util.List;
import java.util.Map;

public class SubjectService {

    private final SubjectDao subjectDao = new SubjectDao();

    public List<Subject> listAll(int userId) throws DaoException {
        return subjectDao.findAll(userId);
    }

    public Subject get(int userId, int id) throws DaoException {
        Subject subject = subjectDao.findById(userId, id);
        if (subject == null) throw new ResourceNotFoundException("Subject " + id + " not found");
        return subject;
    }

    public Subject create(int userId, Map<String, Object> body) throws DaoException {
        List<String> errors = ValidationUtil.newErrorList();
        String name = ValidationUtil.requireNonEmptyString(body, "name", errors);
        ValidationUtil.throwIfErrors(errors);

        String colorHex = ValidationUtil.optionalString(body, "colorHex");
        if (colorHex == null) colorHex = "#7c3aed";

        Subject subject = new Subject(name, colorHex);
        return subjectDao.create(userId, subject);
    }

    public Subject update(int userId, int id, Map<String, Object> body) throws DaoException {
        Subject existing = get(userId, id);
        List<String> errors = ValidationUtil.newErrorList();
        String name = ValidationUtil.requireNonEmptyString(body, "name", errors);
        ValidationUtil.throwIfErrors(errors);
        existing.setName(name);
        existing.setColorHex(ValidationUtil.optionalString(body, "colorHex"));
        subjectDao.update(userId, existing);
        return existing;
    }

    public void delete(int userId, int id) throws DaoException {
        get(userId, id);
        subjectDao.delete(userId, id);
    }
}
