-- Enhanced bulk CSV attendance import with detailed error handling
CREATE OR REPLACE FUNCTION public.insert_attendance_from_csv(rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  rec        jsonb;
  ok_rows    int     := 0;
  bad_rows   jsonb[] := '{}';
  v_emp_id   uuid;
  v_unit_id  uuid;
  the_date   date;
  row_idx    int     := 0;
  v_hours    numeric;
  v_overtime numeric;
begin
  for rec in select * from jsonb_array_elements(rows) loop
    row_idx := row_idx + 1;
    begin
      -- Validate hours_worked
      v_hours := coalesce((rec->>'hours_worked')::numeric, 8);
      if v_hours < 0 OR v_hours > 24 then
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Hours worked must be between 0 and 24. Got: ' || v_hours,
            'category', 'validation'
          )
        );
        continue;
      end if;

      -- Validate overtime_hours
      v_overtime := coalesce((rec->>'overtime_hours')::numeric, 0);
      if v_overtime < 0 then
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Overtime hours cannot be negative. Got: ' || v_overtime,
            'category', 'validation'
          )
        );
        continue;
      end if;

      -- Parse and validate date
      begin
        the_date := to_date(
          regexp_replace(rec->>'date','[\/]','-'),
          case
            when (rec->>'date') ~ '^\d{2}-\d{2}-\d{4}$' then 'DD-MM-YYYY'
            when (rec->>'date') ~ '^\d{4}-\d{2}-\d{2}$' then 'YYYY-MM-DD'
            else 'YYYY-MM-DD'
          end
        );
      exception when others then
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Invalid date format: ' || (rec->>'date') || '. Expected YYYY-MM-DD or DD-MM-YYYY.',
            'category', 'validation'
          )
        );
        continue;
      end;

      -- Check future date
      if the_date > current_date then
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Attendance date cannot be in the future: ' || the_date,
            'category', 'validation'
          )
        );
        continue;
      end if;

      -- Employee lookup
      select id, unit_id
      into v_emp_id, v_unit_id
      from payroll_employees
      where active = true
        and (uan_number = rec->>'employee_code'
          or id::text = rec->>'employee_code')
      limit 1;

      if v_emp_id is null then
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Employee not found or inactive: ' || (rec->>'employee_code'),
            'category', 'missing_data'
          )
        );
        continue;
      end if;

      -- Unit handling (optional override)
      if rec->>'unit_code' is not null and trim(rec->>'unit_code') != '' then
        select unit_id
        into v_unit_id
        from units
        where unit_code = rec->>'unit_code'
        limit 1;
        
        if v_unit_id is null then
          -- Use employee's default unit but warn
          select unit_id into v_unit_id from payroll_employees where id = v_emp_id;
        end if;
      end if;

      -- Check for duplicates
      if exists (
        select 1 from attendance
        where employee_id = v_emp_id
          and attendance_date = the_date
      ) then
        bad_rows := array_append(
          bad_rows,
          jsonb_build_object(
            'rowNumber', row_idx,
            'data', rec,
            'reason', 'Duplicate attendance record for employee ' || (rec->>'employee_code') || ' on ' || the_date,
            'category', 'duplicate'
          )
        );
        continue;
      end if;

      -- Insert the record
      insert into attendance (
        employee_id,
        attendance_date,
        hours_worked,
        overtime_hours,
        unit_id
      ) values (
        v_emp_id,
        the_date,
        v_hours,
        v_overtime,
        v_unit_id
      );

      ok_rows := ok_rows + 1;

    exception when others then
      bad_rows := array_append(
        bad_rows,
        jsonb_build_object(
          'rowNumber', row_idx,
          'data', rec,
          'reason', 'Database error: ' || sqlerrm,
          'category', 'database_error'
        )
      );
    end;
  end loop;

  return jsonb_build_object(
    'successCount', ok_rows,
    'errorCount', coalesce(array_length(bad_rows,1), 0),
    'errors', to_jsonb(bad_rows)
  );
end;
$$;