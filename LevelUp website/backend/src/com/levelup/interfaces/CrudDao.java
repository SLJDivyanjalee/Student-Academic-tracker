package com.levelup.interfaces;

import com.levelup.exception.DaoException;
import java.util.List;

public interface CrudDao<T, ID> {
    T create(int userId, T item) throws DaoException;
    T findById(int userId, ID id) throws DaoException;
    List<T> findAll(int userId) throws DaoException;
    boolean update(int userId, T item) throws DaoException;
    boolean delete(int userId, ID id) throws DaoException;
}
