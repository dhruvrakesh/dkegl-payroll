
BEGIN;

-- bulk CSV attendance import
create or replace function public.insert_attendance_from_csv(rows jsonb)
returns void
language plpgsql
as $$
declare
  rec jsonb;
  emp payroll_employees%rowtype;
  v_unit_id uuid;
begin
  for rec in select * from jsonb_array_elements(rows) loop
    /* employee lookup */
    select * into emp
    from payroll_employees
    where active = true
      and (uan_number = rec->>'employee_code'
        or id::text      = rec->>'employee_code');
    if emp.id is null then
      raise exception using errcode = 'A001',
        message = format('Unknown / inactive employee: %', rec->>'employee_code');
    end if;

    /* unit handling */
    v_unit_id := coalesce(
      (select unit_id from units where unit_name = rec->>'unit_code'),
      emp.unit_id);

    /* date check */
    if (rec->>'date')::date > current_date then
      raise exception 'Attendance date in the future: %', rec->>'date';
    end if;

    /* dupe check */
    if exists (
      select 1 from attendance
      where employee_id = emp.id
        and attendance_date = (rec->>'date')::date
    ) then
      raise exception 'Duplicate for % on %',
        rec->>'employee_code', rec->>'date';
    end if;

    /* insert */
    insert into attendance
      (employee_id, attendance_date, hours_worked,
       overtime_hours, unit_id)
    values
      (emp.id,
       (rec->>'date')::date,
       coalesce((rec->>'hours_worked')::numeric, 8),
       coalesce((rec->>'overtime_hours')::numeric, 0),
       v_unit_id);
  end loop;
end;
$$;

COMMIT;
