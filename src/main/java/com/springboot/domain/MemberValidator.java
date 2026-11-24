package com.springboot.domain;

import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.ValidationUtils;
import org.springframework.validation.Validator;

//제약조건 필드
@Component
public class MemberValidator implements Validator{

    @Override //검증 가능한 클래스인지 검증하는 매서드
	public boolean supports(Class<?> clazz) {
		return Member.class.isAssignableFrom(clazz);
	}

    @Override //실제 검증 로직
	public void validate(Object target, Errors errors) {
		Member product = (Member) target;

        String password = product.getPassword();
	    String email = product.getEmail();
        String phone = product.getPhoneNumber();


        //ID
	    if(product.getId() == null || product.getId().trim().isEmpty())// null 자리에 들어가는 것이 에러코드	            
	        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "id", null, "id을 입력하세요");

        //이름
        if(product.getUsername() == null || product.getUsername().trim().isEmpty())
            ValidationUtils.rejectIfEmptyOrWhitespace(errors, "username", null, "이름을 입력하세요");

        //닉네임
        if(product.getNickname() == null || product.getNickname().trim().isEmpty())
            ValidationUtils.rejectIfEmptyOrWhitespace(errors, "nickname", null, "닉네임을 입력하세요");

        //패스워드
        if (password == null || password.isEmpty()) {
        errors.rejectValue("password", null, "암호를 입력하세요.");
        } else {
            if (password.length() < 8 || password.length() > 16) {
                errors.rejectValue("password", null, "암호는 8자 이상 16자 이하로 입력하세요.");
            }
            if (password.chars().anyMatch(Character::isWhitespace)) {
                errors.rejectValue("password", null, "암호에는 공백을 사용할 수 없습니다.");
            }
            if (password.chars().noneMatch(
                    ch -> !Character.isLetterOrDigit(ch) && !Character.isWhitespace(ch))) {
                errors.rejectValue("password", null, "암호에 특수문자를 하나 이상 포함하세요.");
            }
        }

        //이메일
        if (email == null || email.trim().isEmpty()) {
            errors.rejectValue("email", null, "이메일을 입력하세요.");
        } else if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            errors.rejectValue("email", null, "이메일 형식이 올바르지 않습니다.");
        }

        //전화번호
        if (phone == null || phone.trim().isEmpty()) {
            errors.rejectValue("phoneNumber", null, "전화번호를 입력하세요.");
        } else if (!phone.trim().matches("\\d{2,3}[- ]?\\d{3,4}[- ]?\\d{4}")) {
            errors.rejectValue("phoneNumber", null, "전화번호 형식이 올바르지 않습니다.");
        }
	}
}
