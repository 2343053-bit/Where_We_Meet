package com.springboot.repository;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.springboot.domain.test;

@Repository 
public interface testRepository extends JpaRepository<test, Integer>{
        
}
