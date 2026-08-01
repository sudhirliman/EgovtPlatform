-- Seeds a starter Board/Department/Service for MHADA (Maharashtra Housing and
-- Area Development Authority) e-Mitra, so the admin isn't looking at a
-- completely empty hierarchy after first login. Feel free to edit/delete this
-- via the Board/Dept/Service screen - it's just a starting point, not a
-- hard requirement of the platform.
INSERT INTO board (name, code) VALUES
    ('Maharashtra Housing and Area Development Authority (MHADA)', 'MHADA');

INSERT INTO department (board_id, name, code)
SELECT id, 'Estate Management Department', 'EST_MGMT' FROM board WHERE code = 'MHADA';

INSERT INTO service_master (department_id, name, code, description)
SELECT d.id, 'Transfer of MHADA Tenement/Flat', 'MHADA_TRANSFER',
       'Application for transfer of ownership/tenancy of a MHADA allotted tenement or flat.'
FROM department d
JOIN board b ON b.id = d.board_id
WHERE b.code = 'MHADA' AND d.code = 'EST_MGMT';
