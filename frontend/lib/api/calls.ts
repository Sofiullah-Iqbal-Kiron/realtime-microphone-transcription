import useSWR from "swr"
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios"

import { apiClient } from "@/lib/api/client"
import { endpoints } from "@/lib/api/endpoints"
import { SigninRequest, SignupRequest } from "@/lib/types"


const handleSuccess = (res: AxiosResponse) => {
    return res.data
}
const handleError = (error: AxiosError) => {
    console.log(error.response?.data)
    throw error
}
const getCall = async (endpoint: string, config?: AxiosRequestConfig) => {
    return apiClient.get(endpoint, config).then(res => handleSuccess(res)).catch(err => handleError(err))
}
const postCall = async (endpoint: string, data?: unknown, config?: AxiosRequestConfig) => {
    return apiClient.post(endpoint, data, config).then(res => handleSuccess(res)).catch(err => handleError(err))
}

// fetchers
export const fetcher = (endpoint: string) => getCall(endpoint)

// mutators
export async function postSignin(endpoint: string, { arg }: { arg: SigninRequest }) {
    return postCall(endpoint, arg)
}
export async function postSignup(endpoint: string, { arg }: { arg: SignupRequest }) {
    return postCall(endpoint, arg)
}
export async function postToken(endpoint: string, { arg }: { arg: { token: string } }) {
    return postCall(endpoint, arg)
}
export async function postEmail(endpoint: string, { arg }: { arg: { email: string } }) {
    return postCall(endpoint, arg)
}
export async function postPasswordResetConfirm(endpoint: string, { arg }: { arg: { token: string; new_password: string } }) {
    return postCall(endpoint, arg)
}

// query hooks
export const useFetchedSessions = () => useSWR(endpoints.sessions, fetcher, { refreshInterval: 5000 })
export const useFetchedSessionDetail = (id: string) => useSWR(endpoints.session_detail(id), fetcher)
