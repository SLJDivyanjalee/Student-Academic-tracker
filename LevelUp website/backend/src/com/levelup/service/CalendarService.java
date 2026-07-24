package com.levelup.service;

import com.levelup.dao.AssignmentExamDao;
import com.levelup.dao.StudySessionDao;
import com.levelup.dao.TaskDao;
import com.levelup.exception.DaoException;
import com.levelup.model.AcademicItem;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CalendarService {

    private final TaskDao taskDao = new TaskDao();
    private final AssignmentExamDao assignmentExamDao = new AssignmentExamDao();
    private final StudySessionDao studySessionDao = new StudySessionDao();

    public List<AcademicItem> getItems(int userId, LocalDate from, LocalDate to) throws DaoException {
        List<AcademicItem> all = new ArrayList<>();
        all.addAll(taskDao.findAll(userId));
        all.addAll(assignmentExamDao.findAll(userId));
        all.addAll(studySessionDao.findAll(userId));

        if (from != null && to != null) {
            all.removeIf(item -> item.getDueDate() == null
                    || item.getDueDate().isBefore(from) || item.getDueDate().isAfter(to));
        }
        Collections.sort(all); 
        return all;
    }

    public List<AcademicItem> getDueSoon(int userId, int days) throws DaoException {
        LocalDate today = LocalDate.now();
        List<AcademicItem> items = getItems(userId, today, today.plusDays(days));
        items.removeIf(item -> !item.isDueSoon());
        return items;
    }
}
