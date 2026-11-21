package com.springboot.config;

import java.time.Duration;
import java.util.Locale;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.CookieLocaleResolver;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;

// 다국어 설정. "이 요청은 어느 언어로 보여 줄까(Locale)" 를 정한다.
//   1) 주소에 ?lang=en 이 붙어 오면 그 언어로 바꾸고 (LocaleChangeInterceptor)
//   2) 고른 언어를 쿠키에 기억해서, 다음 요청부터는 ?lang 없이도 유지한다 (CookieLocaleResolver)
//   3) 디폴트는 한국어.
// 번역 문장은 resources/messages.properties(한국어), messages_en.properties(영어) 에 잇음.
@Configuration // 이 클래스 안의 @Bean 들을 서버가 켜질 때 등록하라는 표시. (SecurityConfig 와 같은 방식)
public class LocaleConfig implements WebMvcConfigurer {

    // "지금 언어" 를 어디에 기억할지 정하는 부품.
    // 메서드 이름이 반드시 localeResolver 여야만 Spring 이 이 부품을 찾아 쓴다.
    @Bean
    LocaleResolver localeResolver() {
        CookieLocaleResolver resolver = new CookieLocaleResolver("lang"); // 쿠키 이름: lang
        resolver.setDefaultLocale(Locale.KOREAN);                         // 처음 온 사용자는 한국어.
        resolver.setCookieMaxAge(Duration.ofDays(365));              // 고른 언어를 1년 동안 기억한다.
        return resolver;
    }

    // 주소의 ?lang=값 을 보고 언어를 바꿔 주는 부품. (요청이 컨트롤러에 가기 전에 먼저 실행된다 = 인터셉터)
    @Bean
    LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
        interceptor.setParamName("lang");          // ?lang=ko, ?lang=en
        interceptor.setIgnoreInvalidLocale(true);  // ?lang=@@ 처럼 이상한 값이 와도 에러 내지 않고 무시.
        return interceptor;
    }

    // 위 인터셉터를 모든 요청에 끼워 넣는다.
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeChangeInterceptor());
    }
}
