package com.levelup.interfaces;

public interface ProgressObserver {
    void onProgressChanged(String subjectName, double attendancePercentage);
}
