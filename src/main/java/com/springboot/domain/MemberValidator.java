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
	    if(product.getId() == null || product.getId().trim().isEmpty())// 셋째 값이 오류 코드 = 사전 키. 화면(#fields.errors)이 지금 언어의 사전에서 찾아 보여 준다.	            
	        ValidationUtils.rejectIfEmptyOrWhitespace(errors, "id", "validation.idRequired");

        //이름
        if(product.getUsername() == null || product.getUsername().trim().isEmpty())
            ValidationUtils.rejectIfEmptyOrWhitespace(errors, "username", "validation.usernameRequired");

        //닉네임
        if(product.getNickname() == null || product.getNickname().trim().isEmpty())
            ValidationUtils.rejectIfEmptyOrWhitespace(errors, "nickname", "validation.nicknameRequired");

        //패스워드
        if (password == null || password.isEmpty()) {
        errors.rejectValue("password", "validation.passwordRequired");
        } else {
            if (password.length() < 8 || password.length() > 16) {
                errors.rejectValue("password", "validation.passwordLength");
            }
            if (password.chars().anyMatch(Character::isWhitespace)) {
                errors.rejectValue("password", "validation.passwordWhitespace");
            }
            if (password.chars().noneMatch(
                    ch -> !Character.isLetterOrDigit(ch) && !Character.isWhitespace(ch))) {
                errors.rejectValue("password", "validation.passwordSpecialChar");
            }
        }

        //이메일
        if (email == null || email.trim().isEmpty()) {
            errors.rejectValue("email", "validation.emailRequired");
        } else if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            errors.rejectValue("email", "validation.emailFormat");
        }

        //전화번호
        if (phone == null || phone.trim().isEmpty()) {
            errors.rejectValue("phoneNumber", "validation.phoneRequired");
        } else if (!phone.trim().matches("\\d{2,3}[- ]?\\d{3,4}[- ]?\\d{4}")) {
            errors.rejectValue("phoneNumber", "validation.phoneFormat");
        }
	}
}
