package com.societycms.enums;

public enum FlatType {
    _1BHK("1BHK"), _2BHK("2BHK"), _3BHK("3BHK"), _4BHK("4BHK"), STUDIO("STUDIO"), PENTHOUSE("PENTHOUSE");

    private final String value;

    FlatType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
