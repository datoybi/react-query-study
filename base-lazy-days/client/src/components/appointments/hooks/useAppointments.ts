// @ts-nocheck
import dayjs from 'dayjs';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { axiosInstance } from '../../../axiosInstance';
import { queryKeys } from '../../../react-query/constants';
import { useUser } from '../../user/hooks/useUser';
import { AppointmentDateMap } from '../types';
import { getAvailableAppointments } from '../utils';
import { getMonthYearDetails, getNewMonthYear, MonthYear } from './monthYear';

// for useQuery call
async function getAppointments(
  year: string,
  month: string,
): Promise<AppointmentDateMap> {
  const { data } = await axiosInstance.get(`/appointments/${year}/${month}`);
  return data;
}

// types for hook return object
interface UseAppointments {
  appointments: AppointmentDateMap;
  monthYear: MonthYear;
  updateMonthYear: (monthIncrement: number) => void;
  showAll: boolean;
  setShowAll: Dispatch<SetStateAction<boolean>>;
}

// The purpose of this hook:
//   1. track the current month/year (aka monthYear) selected by the user
//     1a. provide a way to update state
//   2. return the appointments for that particular monthYear
//     2a. return in AppointmentDateMap format (appointment arrays indexed by day of month)
//     2b. prefetch the appointments for adjacent monthYears
//   3. track the state of the filter (all appointments / available appointments)
//     3a. return the only the applicable appointments for the current monthYear

//	1. 유저가 선택한 년, 월을 찾는다
// 		1a. 상태를 업데이트 한다.
//	2. 유저가 선택한 년, 월을 반환한다. (getNewMonthYear)
//		2a. AppointmentDateMap의 형태로 반환한다. (appointment 배열은 월로 인덱싱 되어있음)
//		3b. 안접한 년, 월의 약속들을 prefetch 한다.
//	3. filter의 상태를 추적한다. (모든 예약들 / 가능한 예약 날짜)
//		3a. 현재 년 월의 해당되는 일정들을 반환한다.

export function useAppointments(): UseAppointments {
  /** ****************** START 1: monthYear state *********************** */
  // get the monthYear for the current date (for default monthYear state)
  // 현재 날짜에서 년, 월을 얻는다 (default 년월 상태)
  const currentMonthYear = getMonthYearDetails(dayjs());

  // state to track current monthYear chosen by user
  // state value is returned in hook return object
  // 유저가 선택한 현재 년 월을 추적한다.
  // 상태닶은 훅에서 객체로 반환된다.
  const [monthYear, setMonthYear] = useState(currentMonthYear);
  // setter to update monthYear obj in state when user changes month in view,
  // returned in hook return object
  // 유저가 월을 바꿨을 때, 년월 객체를 업데이트하기위해 세팅한다.
  // 훅에서 객체를 반환한다.
  function updateMonthYear(monthIncrement: number): void {
    setMonthYear((prevData) => getNewMonthYear(prevData, monthIncrement));
  }
  /** ****************** END 1: monthYear state ************************* */
  /** ****************** START 2: filter appointments  ****************** */
  // State and functions for filtering appointments to show all or only available
  // 모든 일정과 가능한 일정을 보여주기 위한 일정을 필터링하는 상태와 함수이다. (체크박스)
  const [showAll, setShowAll] = useState(false);

  // We will need imported function getAvailableAppointments here
  // We need the user to pass to getAvailableAppointments so we can show
  //   appointments that the logged-in user has reserved (in white)
  // getAvailableAppointments 함수를 import 해야한다.
  const { user } = useUser();

  /** ****************** END 2: filter appointments  ******************** */
  /** ****************** START 3: useQuery  ***************************** */
  // useQuery call for appointments for the current monthYear

  // TODO: update with useQuery!
  // Notes:
  //    1. appointments is an AppointmentDateMap (object with days of month
  //       as properties, and arrays of appointments for that day as values)
  //
  //    2. The getAppointments query function needs monthYear.year and
  //       monthYear.month

  // useQuery를 이용하여 현재 년월의 일정을 가져온다

  // 할일: useQuery로 업데이트 하기
  // 1. 일정은  AppointmentDateMap
  // 2. getAppointments 쿼리 함수는 monthYear.year와 monthYear.month를 필요로 한다.
  const queryClient = useQueryClient();

  useEffect(() => {
    const nextMonthYear = getNewMonthYear(monthYear, 1);
    queryClient.prefetchQuery(
      [queryKeys.appointments, nextMonthYear.year, nextMonthYear.month],
      () => getAppointments(nextMonthYear.year, nextMonthYear.month),
    );
  }, [monthYear, queryClient]);

  const fallback = {};

  const { data: appointments = fallback } = useQuery(
    [queryKeys.appointments, monthYear.year, monthYear.month],
    () => getAppointments(monthYear.year, monthYear.month),
  );

  /** ****************** END 3: useQuery  ******************************* */

  return { appointments, monthYear, updateMonthYear, showAll, setShowAll };
}
