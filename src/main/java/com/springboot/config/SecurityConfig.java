package com.springboot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    
    @Bean // PasswordEncoder 빈을 생성하는 메서드입니다. 이 메서드는 BCryptPasswordEncoder를 반환하여 비밀번호를 암호화하는 데 사용됩니다.  
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // 비밀번호를 암호화하는 PasswordEncoder 빈을 생성.
    }

    @Bean // SecurityFilterChain 빈을 생성하는 메서드입니다. 이 메서드는 HttpSecurity를 사용하여 보안 구성을 설정합니다.
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            UserDetailsService userDetailsService) throws Exception { // throws Exception은 HttpSecurity 설정 중 발생할 수 있는 예외를 처리하기 위해 선언되었습니다.
        http
            .userDetailsService(userDetailsService)
            .authorizeHttpRequests(auth -> auth // auth는 HttpSecurity의 authorizeHttpRequests 메서드에서 제공하는 객체로, 요청에 대한 권한을 설정하는 데 사용됩니다.
                .requestMatchers("/login", "/signup", "/css/**", "/js/**") // 로그인, 회원가입, CSS, JS 경로에 대한 요청은 인증 없이 접근 가능하도록 설정
                .permitAll()
                .anyRequest() // 그 외의 모든 요청은 인증이 필요하도록 설정
                .authenticated()
            )

            // 로그인 페이지와 관련된 설정을 구성합니다. 
            // formLogin 메서드를 사용하여 로그인 페이지, 로그인 처리 URL, 사용자 이름 및 비밀번호 매개변수, 로그인 성공 및 실패 시 이동할 URL 등을 설정합니다.
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/login") // 로그인 처리 URL을 설정합니다. 사용자가 로그인 폼을 제출하면 이 URL로 요청이 전송됩니다.
                .usernameParameter("username")
                .passwordParameter("password")
                .defaultSuccessUrl("/main", true) // 로그인 성공 시 이동할 URL을 설정합니다. true를 전달하여 항상 이 URL로 리다이렉트되도록 합니다.
                .failureUrl("/login?error=true") // 로그인 실패 시 이동할 URL을 설정합니다. 로그인 실패 시 쿼리 파라미터 error=true를 추가하여 로그인 페이지로 리다이렉트됩니다.
                .permitAll()
            )
            .logout(logout -> logout
                .logoutSuccessUrl("/login?logout=true")
                .permitAll()
            );

        return http.build();
    }
}
    