package com.egov.platform.hierarchy;

import com.egov.platform.hierarchy.dto.DepartmentRequest;
import com.egov.platform.hierarchy.dto.DepartmentResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final BoardRepository boardRepository;

    public DepartmentController(DepartmentRepository departmentRepository, BoardRepository boardRepository) {
        this.departmentRepository = departmentRepository;
        this.boardRepository = boardRepository;
    }

    @GetMapping
    public List<DepartmentResponse> list(@RequestParam(required = false) UUID boardId) {
        List<Department> departments = boardId != null
                ? departmentRepository.findByBoardId(boardId)
                : departmentRepository.findAll();
        return departments.stream().map(DepartmentResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'DEPARTMENT_MANAGE')")
    public DepartmentResponse create(@Valid @RequestBody DepartmentRequest request) {
        Board board = boardRepository.findById(request.boardId())
                .orElseThrow(() -> new NoSuchElementException("Board not found: " + request.boardId()));
        Department department = new Department();
        department.setBoard(board);
        department.setNameEnglish(request.nameEnglish());
        department.setNameMarathi(request.nameMarathi());
        department.setCode(request.code());
        if (request.active() != null) department.setActive(request.active());
        return DepartmentResponse.from(departmentRepository.save(department));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'DEPARTMENT_MANAGE')")
    public DepartmentResponse update(@PathVariable UUID id, @Valid @RequestBody DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Department not found: " + id));
        Board board = boardRepository.findById(request.boardId())
                .orElseThrow(() -> new NoSuchElementException("Board not found: " + request.boardId()));
        department.setBoard(board);
        department.setNameEnglish(request.nameEnglish());
        department.setNameMarathi(request.nameMarathi());
        department.setCode(request.code());
        if (request.active() != null) department.setActive(request.active());
        return DepartmentResponse.from(departmentRepository.save(department));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasPermission(null, 'DEPARTMENT_MANAGE')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Department not found: " + id));
        department.setActive(false);
        departmentRepository.save(department);
        return ResponseEntity.noContent().build();
    }
}
