package com.egov.platform.hierarchy;

import com.egov.platform.hierarchy.dto.BoardRequest;
import com.egov.platform.hierarchy.dto.BoardResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/boards")
public class BoardController {

    private final BoardRepository boardRepository;

    public BoardController(BoardRepository boardRepository) {
        this.boardRepository = boardRepository;
    }

    @GetMapping
    public List<BoardResponse> list() {
        return boardRepository.findAll().stream().map(BoardResponse::from).toList();
    }

    @GetMapping("/{id}")
    public BoardResponse get(@PathVariable UUID id) {
        return BoardResponse.from(boardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Board not found: " + id)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'BOARD_MANAGE')")
    public BoardResponse create(@Valid @RequestBody BoardRequest request) {
        Board board = new Board();
        board.setNameEnglish(request.nameEnglish());
        board.setNameMarathi(request.nameMarathi());
        board.setCode(request.code());
        if (request.active() != null) board.setActive(request.active());
        return BoardResponse.from(boardRepository.save(board));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'BOARD', 'BOARD_MANAGE')")
    public BoardResponse update(@PathVariable UUID id, @Valid @RequestBody BoardRequest request) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Board not found: " + id));
        board.setNameEnglish(request.nameEnglish());
        board.setNameMarathi(request.nameMarathi());
        board.setCode(request.code());
        if (request.active() != null) board.setActive(request.active());
        return BoardResponse.from(boardRepository.save(board));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasPermission(#id, 'BOARD', 'BOARD_MANAGE')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Board not found: " + id));
        board.setActive(false);
        boardRepository.save(board);
        return ResponseEntity.noContent().build();
    }
}
